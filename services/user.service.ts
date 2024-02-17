import UserModel from "../models/user.model";
import bcrypt from "bcrypt";
import { v4 } from "uuid";
import { MailService } from "./mail.service";
import { TokenService } from "./token.service";
import UserDto from "../dtos/user.dto";
import ApiError from "../exceptions/error";

export namespace UserService {
  export const registration = async (email: string, password: string) => {
    const candidate = await UserModel.findOne({ email });
    if (candidate) {
      throw ApiError.BadRequest(`User with the email ${email} already exists`);
    }
    const activationLink = v4();
    const hashedPassword = await bcrypt.hash(password, 7);
    const user = await UserModel.create({
      email,
      password: hashedPassword,
      activationLink,
    });
    await MailService.sendActivationMail(
      email,
      `${process.env.API_URL}/api/activate/${activationLink}`
    );
    const payload = new UserDto(user);
    const tokens = TokenService.generateTokens({ ...payload });
    await TokenService.saveToken(payload.id, tokens.refreshToken);
    return {
      ...tokens,
      user: payload,
    };
  };

  export const activate = async (activationLink: string) => {
    const user = await UserModel.findOne({ activationLink });
    if (!user) {
      throw ApiError.BadRequest("Incorrect activation link");
    }
    user.isActivated = true;
    await user.save();
  };

  export const login = async (email: string, password: string) => {
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw ApiError.BadRequest("User with this email was not found");
    }

    const isPasswordEquals = await bcrypt.compare(password, user.password);
    if (!isPasswordEquals) {
      throw ApiError.BadRequest("Incorrect password");
    }
    const payload = new UserDto(user);
    const tokens = TokenService.generateTokens({ ...payload });
    await TokenService.saveToken(payload.id, tokens.refreshToken);
    return {
      ...tokens,
      user: payload,
    };
  };

  export const logout = async (refreshToken: string) => {
    const token = await TokenService.removeToken(refreshToken);
    return token;
  };

  export const refresh = async (refreshToken: string) => {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError();
    }
    const userData = TokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await TokenService.findToken(refreshToken);

    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError();
    }

    const user = await UserModel.findById(userData.id);

    if (user) {
      const payload = new UserDto(user);
      const tokens = TokenService.generateTokens({ ...payload });
      await TokenService.saveToken(payload.id, tokens.refreshToken);
      return {
        ...tokens,
        user: payload,
      };
    } else {
      throw ApiError.BadRequest("User was not found");
    }
  };
}
