from fastapi import APIRouter

router = APIRouter(prefix="/api/data-sources", tags=["data-sources"])

DATA_SOURCES = [
    {
        "name": "Sentinel-1 SAR", "type": "Radar imagery", "resolution": "10 m",
        "usage": "Flood extent detection (all-weather, day/night)",
        "status": "Demo dataset — real ingestion path documented in docs/data_sources.md",
    },
    {
        "name": "Sentinel-2 Optical", "type": "Multispectral imagery", "resolution": "10-20 m",
        "usage": "Land cover / settlement change, cloud-free confirmation of flood extent",
        "status": "Demo dataset",
    },
    {
        "name": "OpenStreetMap", "type": "Vector GIS", "resolution": "N/A",
        "usage": "WASH facility locations, roads, rivers, administrative boundaries",
        "status": "Demo dataset",
    },
    {
        "name": "Digital Elevation Model (DEM)", "type": "Raster elevation", "resolution": "30 m (SRTM-class)",
        "usage": "Slope, low-lying area identification, flood accumulation proxy",
        "status": "Demo dataset",
    },
    {
        "name": "Population raster", "type": "Gridded population estimate", "resolution": "100 m (WorldPop-class)",
        "usage": "Population exposure, priority scoring input",
        "status": "Demo dataset",
    },
    {
        "name": "Administrative boundaries", "type": "Vector GIS", "resolution": "N/A",
        "usage": "District / municipality aggregation",
        "status": "Demo dataset",
    },
]


@router.get("")
def list_data_sources():
    return {"results": DATA_SOURCES}
