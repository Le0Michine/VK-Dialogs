export interface GeoAtt {
    type: string;
    coordinates: string;
    place: GeoPlace;
}

export interface GeoPlace {
    id: number;
    title: string;
    latitude: number;
    longitude: number;
    created: number;
    icon: string;
    country: string;
    city: string;
}