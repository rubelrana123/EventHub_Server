import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AuthService } from "./auth.service";

const login = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);
    const { accessToken, refreshToken, needPasswordChange } = result;
   // Set cookie name to val, with the given options.
    res.cookie("accessToken", accessToken, {
        secure: true,
        httpOnly: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60
    })
    res.cookie("refreshToken", refreshToken, {
        secure: true,
        httpOnly: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 90
    })

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "User loggedin successfully!",
        data: {
            accessToken,
            refreshToken,
            needPasswordChange
        }
    })
});

const getMe = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const user = req.cookies;

  const result = await AuthService.getMe(user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});


export const AuthController = {
    login,
    getMe
}