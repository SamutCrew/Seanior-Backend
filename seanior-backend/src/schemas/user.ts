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
