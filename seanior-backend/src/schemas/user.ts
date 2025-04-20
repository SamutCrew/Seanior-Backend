export class createUser {
  user_id?: string;
  firebase_uid: string;
  email: string;
  name?: string;
  profile_img?: string;
  user_type?: string;
}

export class checkUser {
  firebase_uid: string;
}