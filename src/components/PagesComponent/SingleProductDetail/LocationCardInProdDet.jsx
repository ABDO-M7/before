'use client'
import Map from "@/components/MyListing/OpenStreetMap"
import { t } from "@/utils"
import { IoLocationOutline } from "react-icons/io5"


const LocationCardInProdDet = ({ productData }) => {


    const handleShowMapClick = () => {
        const locationQuery = `${productData?.city}, ${productData?.state}, ${productData?.country}`;
        
        // const googleMapsUrl = `https://www.google.com/maps?q=${locationQuery}&ll=${productData?.latitude},${productData?.longitude}&z=12&t=m`;
        // const googleMapsUrl = `https://www.google.com/maps?q=${productData?.latitude},${productData?.longitude}&z=15`;
        
        // const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(locationQuery)}/@${productData?.latitude},${productData?.longitude},15z`;
        
        // const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}&query_place_id=${productData?.latitude},${productData?.longitude},15z`;

        const googleMapsUrl = `https://www.google.com/maps?q=${productData?.latitude},${productData?.longitude}&z=15`;

        window.open(googleMapsUrl, '_blank');
    };


    return (
        <div className="posted_in_card card">
            <div className="card-header">
                <span>{t('postedIn')}</span>
            </div>
            <div className="card-body">
                <div className="location">
                    <span><IoLocationOutline size={24} /></span>
                    <span>
                        {productData?.city}{productData?.city ? "," : null} {productData?.state}{productData?.state ? "," : null} {productData?.country}
                    </span>
                </div>
                <div className="location_details_map" style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}>
                    <Map latitude={productData?.latitude} longitude={productData?.longitude} />
                </div>
                <div className="show_full_map">
                    <button onClick={handleShowMapClick}>{t('showOnMap')}</button>
                </div>
            </div>
        </div>
    )
}

export default LocationCardInProdDet