export class User {
    // user ID. 
    // positive number
    uid: number;

    // first name. 
    // string
    first_name: string;

    // last name. 
    // string
    last_name: string;

    // returns if a profile is deleted or blocked. 
    // Gets the value deleted or banned. 
    // Keep in mind that in this case no additional fields are returned.
    // deactivated: boolean;

    // returns while operating without access_token if a user has set the 
    // "Who can see my profile on the Internet" → "Only VK users" privacy setting.
    // Keep in mind that in this case no additional fields are returned.
    // hidden: boolean;

    // returns URL of square photo of the user with 50 pixels in width.  
    // In case user does not have a photo, http://vk.com/images/camera_c.gif is returned. 
    // string
    photo_50: string;   
}

/*
	
 */