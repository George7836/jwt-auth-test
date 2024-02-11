const UserModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const uuid = require("uuid");
const mailService = require("./mail.service");
const tokenService = require("./token.service");
const UserDto = require("../dtos/user.dto");
const ApiError = require("../exceptions/error");
const userModel = require("../models/user.model");

class UserService {
  async registration(email, password) {
    const candidate = await UserModel.findOne({ email });
    if (candidate) {
      throw ApiError.BadRequest(
        `Пользователь с почтовым адресом ${email} уже существует`
      );
    }
    const activationLink = uuid.v4();
    const hashedPassword = await bcrypt.hash(password, 7);
    const user = await UserModel.create({
      email,
      password: hashedPassword,
      activationLink,
    });
    await mailService.sendActivationMail(
      email,
      `${process.env.API_URL}/api/activate/${activationLink}`
    );
    const payload = new UserDto(user);
    const tokens = tokenService.generateTokens({ ...payload });
    await tokenService.saveToken(payload.id, tokens.refreshToken);
    return {
      ...tokens,
      user: payload,
    };
  }

  async activate(activationLink) {
    const user = await UserModel.findOne({ activationLink });
    if (!user) {
      throw ApiError.BadRequest("Неккоректная ссылка активации");
    }
    user.isActivated = true;
    await user.save();
  }

  async login(email, password) {
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw ApiError.BadRequest("Пользователь с таким email не найден");
    }

    const isPasswordEquals = await bcrypt.compare(password, user.password);
    if (!isPasswordEquals) {
      throw ApiError.BadRequest("Неверный пароль");
    }

    const payload = new UserDto(user);
    const tokens = tokenService.generateTokens({ ...payload });
    await tokenService.saveToken(payload.id, tokens.refreshToken);
    return {
      ...tokens,
      user: payload,
    };
  }

  async logout(refreshToken) {
    const token = await tokenService.removeToken(refreshToken);
    return token;
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError();
    }
    const userData = tokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenService.findToken(refreshToken);

    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError();
    }

    const user = await userModel.findById(userData.id);
    const payload = new UserDto(user);
    const tokens = tokenService.generateTokens({ ...payload });
    await tokenService.saveToken(payload.id, tokens.refreshToken);
    return {
      ...tokens,
      user: payload,
    };
  }

  async getAllUsers() {
    const users = userModel.find();
    return users;
  }
}

module.exports = new UserService();
