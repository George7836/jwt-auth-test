import { Types } from "mongoose";

export interface PayloadParams {
  email: string;
  id: string;
  isActivated: boolean;
}

interface UserDtoParams {
  email: string;
  _id: Types.ObjectId;
  isActivated: boolean;
}

export default class UserDto {
  email: string;
  id: string;
  isActivated: boolean;

  constructor({ email, _id, isActivated }: UserDtoParams) {
    this.email = email;
    this.id = _id.toString();
    this.isActivated = isActivated;
  }
}
