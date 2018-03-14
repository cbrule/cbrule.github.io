# ---------------------------------------------------------------------------
# CreateSupport.py
#
# Last updated: 05/07/14
# 
# Exports selected parcels from parcel layer to Support layer.
# ---------------------------------------------------------------------------

import arcpy
arcpy.env.overwriteOutput = True

mxd = arcpy.mapping.MapDocument("CURRENT")
Support = r"K:\Community Development\GIS\CommDevGDB.gdb\Support"

#Check to see if anything was selected
count = int (arcpy.GetCount_management("Parcels").getOutput(0))
if count > 1000:
	arcpy.AddMessage("No parcels selected. Current parcels in support will be cleared...")
	cur = arcpy.da.UpdateCursor(Support,"SHAPE@")
	for row in cur:
		cur.deleteRow()
	del cur
else:
	cursor = arcpy.da.SearchCursor("Parcels","SHAPE@")
	cur = arcpy.da.InsertCursor("Support","SHAPE@")
	for row in cursor:
		cur.insertRow(row)
	del cur

#Clean up
arcpy.SelectLayerByAttribute_management("Parcels", "CLEAR_SELECTION")
mxd.dataDrivenPages.refresh()
