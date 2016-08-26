export let ATTACHMENT_TYPES = {
    "photo": "photo",
    "video": "video",
    "audio": "audio",
    "doc": "document",
    "wall": "wall post"
};

export class Photo {
    /** photo ID */
    pid: number;

    /** ID of photo owner */
    owner_id: number;

    /** image URL */
    src: string;

    /** big size image URL */
    src_big: string;
}

export class Video {
    /** video ID */
    vid: number;

    /** ID of video owner */
    owner_id: number;

    /** video title */
    title: string;

    /** video description */
    description: string;

    /** video duration, in seconds */
    duration: number;

    /** video preview image URL */
    image: string;

    /** video preview image URL with the size of */
    image_big: string;

    /** video preview image URL with the size of */
    image_small: string;

    /** number of views of the video */
    views: number;

    /** date when the video was added */
    date: number;
}

export class Audio {
    /** audio ID */
    aid: number;

    /** audio owner ID */
    owner_id: number;

    /** artist */
    performer: string;

    /** title of the audio */
    title: string;

    /** duration of the audio in seconds */
    duration: number;

    /** link to mp3 */
    url: string;
}

export class WallPost {
    /** wall post ID */
    id: number;

    /** post owner ID */
    to_id: number;

    /** ID of the user who posted */
    from_id: number;
}