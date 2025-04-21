import { ApiProperty } from '@nestjs/swagger';

export class verifyToken {
  @ApiProperty()
  token: string;
}