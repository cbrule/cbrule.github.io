# ---------------------------------------------------------------------------
# BufferNotification.py
#
# Last updated: 05/04/15
# 
# Creates a 200 & 300 ft buffer around selected parcel(s). Exports a list of property owners 
# that fall within the 300 ft buffer. Calculates square footage and acreage of land area in 200 ft buffer.
# ---------------------------------------------------------------------------

import arcpy, sys
arcpy.env.overwriteOutput = True

input = arcpy.GetParameterAsText(0)
NoticeArea = r"K:\Community Development\GIS\CommDevGDB.gdb\NoticeArea"
AreaOfRequest = r"K:\Community Development\GIS\CommDevGDB.gdb\AreaOfRequest"
ClippedParcels = r"K:\Community Development\GIS\CommDevGDB.gdb\ClippedParcels"
NotifiedParcels = r"K:\Community Development\GIS\CommDevGDB.gdb\NotifiedParcels"
fields = ("PageNo", "BufferArea", "BufferAcres","SHAPE_Area")
mxd = arcpy.mapping.MapDocument("CURRENT")
df = arcpy.mapping.ListDataFrames(mxd, "Layers") [0]


#Check to make sure something was selected
count = int (arcpy.GetCount_management(input).getOutput(0))
if count > 100:
	arcpy.AddMessage("NO PARCELS SELECTED")
	sys.exit(0)
else:
	arcpy.Dissolve_management(input, AreaOfRequest)

#Run buffer
arcpy.MultipleRingBuffer_analysis(AreaOfRequest,'in_memory/tmpBuf',[200,300],"Feet","","ALL","FULL")


#Check if buffer extends beyond city limit
arcpy.MakeFeatureLayer_management('in_memory/tmpBuf', "tmpLyr")
arcpy.SelectLayerByLocation_management("tmpLyr", "CROSSED_BY_THE_OUTLINE_OF","City Limit","","NEW_SELECTION")
count = str(arcpy.Describe("tmpLyr").FIDset)

if count == "1" or count == "2" or count == "1; 2":
	arcpy.Clip_analysis('in_memory/tmpBuf',"City Limit",'in_memory/tmpBuf2')
else:
	arcpy.CopyFeatures_management('in_memory/tmpBuf', 'in_memory/tmpBuf2')

#Export parcels within 300ft
arcpy.SelectLayerByLocation_management("Parcels","INTERSECT",'in_memory/tmpBuf2',"","NEW_SELECTION")
arcpy.CopyFeatures_management("Parcels", NotifiedParcels)

#Query related table - using function from
#http://gis.stackexchange.com/questions/50287/how-can-i-more-efficiently-select-related-records/50451#50451

def buildWhereClauseFromList(table, field, valueList):
    """Takes a list of values and constructs a SQL WHERE
    clause to select those values within a given field and table."""

    # Add DBMS-specific field delimiters
    fieldDelimited = arcpy.AddFieldDelimiters(arcpy.Describe(table).path, field)

    # Determine field type
    fieldType = arcpy.ListFields(table, field)[0].type

    # Add single-quotes for string field values
    if str(fieldType) == 'String':
        valueList = ["'%s'" % value for value in valueList]

    # Format WHERE clause in the form of an IN statement
    whereClause = "%s IN(%s)" % (fieldDelimited, ', '.join(map(str, valueList)))
    return whereClause

	
def selectRelatedRecords(sourceLayer, targetLayer, sourceField, targetField):
    sourceIDs = set([row[0] for row in arcpy.da.SearchCursor(sourceLayer, sourceField)])
    whereClause = buildWhereClauseFromList(targetLayer, targetField, sourceIDs)
    arcpy.AddMessage("Selecting related records using WhereClause: {0}".format(whereClause))
    arcpy.SelectLayerByAttribute_management(targetLayer, "NEW_SELECTION", whereClause)
	
selectRelatedRecords("Parcels", "PARCELTAX", "GIS_Link", "GISLINK")
arcpy.TableToExcel_conversion("PARCELTAX",r"K:\Community Development\GIS\300ftBuffer.xls")

#Clip parcels to 200ft buffer
arcpy.MakeFeatureLayer_management('in_memory/tmpBuf2', "tmpLyr2")
arcpy.SelectLayerByAttribute_management("tmpLyr2","NEW_SELECTION",' "distance" = 200 ')
arcpy.Clip_analysis("Parcels","tmpLyr2",ClippedParcels)

#Add fields
arcpy.AddField_management('in_memory/tmpBuf2', "PageNo", "LONG")
arcpy.AddField_management('in_memory/tmpBuf2', "Opposed", "DOUBLE")
arcpy.AddField_management('in_memory/tmpBuf2', "OpposedAcres", "DOUBLE")
arcpy.AddField_management('in_memory/tmpBuf2', "PercentOpposed", "DOUBLE")
arcpy.AddField_management('in_memory/tmpBuf2', "BufferArea", "DOUBLE")
arcpy.AddField_management('in_memory/tmpBuf2', "BufferAcres", "DOUBLE")

#Create NoticeArea feature class
arcpy.CopyFeatures_management('in_memory/tmpBuf2',NoticeArea)

#Update fields
with arcpy.da.SearchCursor("AreaOfRequest","SHAPE_Area") as cursor:
	for row in cursor:
		AreaAcres= row[0]


with arcpy.da.UpdateCursor(NoticeArea,fields,' "distance" = 200 ') as cur:
	for row in cur:
		row[0] = 1
		row[1] = round(row[3] - AreaAcres,2)
		row[2] = round((row[3] - AreaAcres) / 43560,2)
		cur.updateRow(row)

#Clean-up
arcpy.Delete_management('in_memory')
df.zoomToSelectedFeatures()
arcpy.SelectLayerByAttribute_management("Parcels", "CLEAR_SELECTION")
arcpy.SelectLayerByAttribute_management("NoticeArea", "CLEAR_SELECTION")
mxd.dataDrivenPages.refresh()
