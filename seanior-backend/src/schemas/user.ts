import { ApiProperty } from '@nestjs/swagger';
export class createUserDto {
  @ApiProperty()
  user_id?: string;

  @ApiProperty()
  firebase_uid: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  profile_img?: string;

  @ApiProperty()
  user_type?: string;
}

export class checkUserDto {
  @ApiProperty()
  firebase_uid: string;
}

export class userDataDto {
  @ApiProperty()
  user_id: string;

  @ApiProperty()
  firebase_uid: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  gender?: string;

  @ApiProperty()
  address?: string;

  @ApiProperty()
  phone_number?: string;

  @ApiProperty()
  profile_img?: string;

  @ApiProperty()
  user_type?: string;

  @ApiProperty()
  description?: JSON;
}

export class updateUserDataDto {
  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  gender?: string;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty({ required: false })
  phone_number?: string;

  @ApiProperty({ required: false })
  profile_img?: string;

  @ApiProperty({ required: false })
  user_type?: string;

  @ApiProperty({ required: false })
  description?: any;
}
