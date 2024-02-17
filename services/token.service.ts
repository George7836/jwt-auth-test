import { PayloadParams } from "../dtos/user.dto";
import TokenModel from "../models/token.model";
import { JwtPayload, sign, verify } from "jsonwebtoken";

interface TokenPayload {
  iat: number;
  exp: number;
  email: string;
  id: string;
  isActivated: boolean;
}

const accesTokenSecret = process.env.JWT_ACCESS_SECRET ?? "AccessSecretKey";
const refreshTokenSecret = process.env.JWT_REFRESH_SECRET ?? "RefreshSecretKey";

export namespace TokenService {
  export const generateTokens = (payload: PayloadParams) => {
    const accessToken = sign(payload, accesTokenSecret, {
      expiresIn: "30m",
    });
    const refreshToken = sign(payload, refreshTokenSecret, {
      expiresIn: "30d",
    });
    return {
      accessToken,
      refreshToken,
    };
  };

  export const validateAccessToken = (token: string) => {
    try {
      const userData = verify(token, accesTokenSecret) as JwtPayload &
        TokenPayload;
      return userData;
    } catch (e) {
      return null;
    }
  };
  export const validateRefreshToken = (token: string) => {
    try {
      const userData = verify(token, refreshTokenSecret) as JwtPayload &
        TokenPayload;
      return userData;
    } catch (e) {
      return null;
    }
  };

  export const saveToken = async (userId: string, refreshToken: string) => {
    const existedToken = await TokenModel.findOne({ user: userId });
    if (existedToken) {
      existedToken.refreshToken = refreshToken;
      return existedToken.save();
    }
    const token = TokenModel.create({ user: userId, refreshToken });
    return token;
  };

  export const removeToken = async (refreshToken: string) => {
    const tokenData = await TokenModel.deleteOne({ refreshToken });
    return tokenData;
  };

  export const findToken = async (refreshToken: string) => {
    const tokenData = await TokenModel.findOne({ refreshToken });
    return tokenData;
  };
}
