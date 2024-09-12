import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js"
import ErrorHandler from "../middlewares/error.js"
import { User } from "../models/user.models.js"
import {v2 as cloudinary} from "cloudinary";
import { sendToken } from "../utils/jwtToken.js";

export const register = catchAsyncErrors(async (req, res, next) => {
    try {
        const { name, email, phone, address, password, role, firstNiche, secondNiche, thirdNiche, coverLetter } = req.body;

        if (!name || !email || !phone || !password || !address || !role) {
            return next(new ErrorHandler("All field are required", 400))
        }

        if (role === "Job Seeker" && (!firstNiche || !secondNiche || !thirdNiche)) {
            return next(new ErrorHandler("please provide your niches", 400))
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new ErrorHandler("Email already registered", 400))
        }

        const userData = {
            name,
            email,
            phone,
            address,
            password,
            role,
            niches: {
                firstNiche,
                secondNiche,
                thirdNiche,
            },
            coverLetter
        };

        if (req.files && req.files.resume){
            const {resume} = req.files;
            if (resume){
                try {
                    const cloudinaryResponse = await cloudinary.uploader.upload(resume.tempFilePath,
                    {folder: "Job_Seeker_Resume"})

                    if (!cloudinaryResponse || cloudinaryResponse.error){
                        return next(new ErrorHandler("failed to upload resume on cloudinary", 500))
                    }
                    userData.resume = {
                        public_id : cloudinaryResponse.public_id,
                        url: cloudinaryResponse.url
                    }
                } catch (error) {
                    return next(new ErrorHandler("failed to upload resume", 500))
                }
            }
        }
        const user = await User.create(userData);
        sendToken(user, 201, res, "user egistered")
    } catch (error) {
        return next(error)
    }
})

export const login = catchAsyncErrors(async(req,res,next)=>{
    const {role, email, password} = req.body;
    if(!role || !email || !password){
        return next(
            new ErrorHandler("Email, password and role are required", 400)
        )
    }

    const user = await User.findOne({email}).select("+password");
    if (!user){
        return next(
            new ErrorHandler("email not found", 400)
        )
    }

    const isPasswordMatched = await user.comparePassword(password);
    if(!isPasswordMatched){
        return next(new ErrorHandler("Invalid Password", 400))
    }

    if(user.role !== role){
        return next (new ErrorHandler("Invalid user role", 400))
    }

    sendToken(user, 200, res, "user logged in successfully")
})

export const logout = catchAsyncErrors(async(req,res,next)=>{
    res.status(200).cookie("token", "", {
        expires: new Date(
            Date.now()
        ),
        httpOnly : true,
    } ).json({
        success: true,
        message: "Logout Successfully"
    })
})

export const getUser = catchAsyncErrors(async(req,res,next)=>{
    const user = req.user;
    res.status(200).json({
        success: true,
        user,
        message: "user fetched successfully"
    })
})

export const updateProfile = catchAsyncErrors(async ( req , res, next)=>{
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        coverLetter: req.body.coverLetter,
        niches: {
            firstNiche: req.body.firstNiche,
            secondNiche: req.body.secondNiche,
            thirdNiche: req.body.thirdNiche
        }
    }

    const {firstNiche, secondNiche, thirdNiche} = newUserData.niches;

    if(req.user.role === "Job Seeker" && (!firstNiche || !secondNiche || !thirdNiche)){
        return next(new ErrorHandler("niches are requires", 400))
    }

    if(req.files){
        const resume = req.files.resume;
        if(resume){
            const  currentResumeId = req.user.resume.public_id;
            if(currentResumeId){
                await cloudinary.uploader.destroy(currentResumeId)
            }
            const newResume = await cloudinary.uploader.upload(resume.tempFilePath, {
                folder: "Job_Seeker_Resume"
            })
            newUserData.resume = {
                public_id: newResume.public_id,
                url: newResume.secure_url,
            }
        }
    }

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new:true,
        runValidators: true,
        useFindAndModify: false,
    })
    res.status(200).json({
        success: true,
        user,
        message: "profile updated successfully"
    })
})

export const updatePassword = catchAsyncErrors(async(req,res,next)=>{
    const user = await User.findById(req.user.id).select("+password");
    const isPasswordMatched = await user.comparePassword(req.body.oldPassword)

    if(!isPasswordMatched) {
        return next (new ErrorHandler("Old password is incorrect", 400))
    }

    if(req.body.newPassword !== req.body.confirmPassword){
        return next( new ErrorHandler("New Password and confirm passwrod dont match", 400))
    }

    user.password = req.body.newPassword;
    await user.save();
    sendToken(user, 200,res, "password updated successfully")

})