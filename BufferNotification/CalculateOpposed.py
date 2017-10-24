# ---------------------------------------------------------------------------
# CalculateOpposed.py
#
# Last updated: 05/08/14
# 
# Calculates land area that is opposed based on selection from Parcels layer.
# Exports parcel to opposed Layer. Calculation is done based on the land area 
# that falls within the 200 ft buffer.
# ---------------------------------------------------------------------------

import arcpy
arcpy.env.overwriteOutput = True

mxd = arcpy.mapping.MapDocument("CURRENT")
SumOpposed = r'in_memory/SumOpposed'
Opposed = r"K:\Community Development\GIS\CommDevGDB.gdb\Opposed"
fields = ("Opposed","OpposedAcres","PercentOpposed", "BufferArea")

#Check to make sure something was selected
count = int (arcpy.GetCount_management("Parcels").getOutput(0))
if count > 1000:
	arcpy.AddMessage("No parcels selected. Current parcels in opposition will be cleared...")
	cur = arcpy.da.UpdateCursor(Opposed,"SHAPE@")
	for row in cur:
		cur.deleteRow()
	del cur

	#Update fields		
	with arcpy.da.UpdateCursor("NoticeArea",fields,' "distance" = 200 ') as cur:
		for row in cur:
			row[0] = 0
			row[1] = 0
			row[2] = 0
			cur.updateRow(row)
	mxd.dataDrivenPages.refresh()
	sys.exit(0)
	
arcpy.SelectLayerByLocation_management("ClippedParcels","WITHIN","Opposed","","NEW_SELECTION")
arcpy.SelectLayerByLocation_management("ClippedParcels","WITHIN","Parcels","","ADD_TO_SELECTION")

sum = 0
with arcpy.da.SearchCursor("ClippedParcels","SHAPE@AREA") as cursor:
	for row in cursor:
		sum+= row[0]

#Update fields		
with arcpy.da.UpdateCursor("NoticeArea",fields,' "distance" = 200 ') as cur:
	for row in cur:
		row[0] = round(sum,2)
		row[1] = round(sum / 43560,2)
		row[2] = round((sum / row[3]) * 100,2)
		cur.updateRow(row)

#export full parcel
cursor = arcpy.da.SearchCursor("Parcels","SHAPE@")
cur = arcpy.da.InsertCursor(Opposed,"SHAPE@")
for row in cursor:
	cur.insertRow(row)
del cur

#Clean up
arcpy.SelectLayerByAttribute_management("Parcels", "CLEAR_SELECTION")
arcpy.SelectLayerByAttribute_management("ClippedParcels", "CLEAR_SELECTION")
mxd.dataDrivenPages.refresh()
