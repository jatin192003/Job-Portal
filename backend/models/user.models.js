import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import validator from "validator";

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        minLength: [3, "Name must conatin atleast 3 characters"],
    },
    email:{
        type: String,
        required: true,
        validate: [validator.isEmail, "Please provide valid email"]
    },
    phone:{
        type: Number,
        required: true
    },
    address:{
        type: String,
        required: true
    },
    niches:{
        firstNiche: String,
        secondNiche: String,
        thirdNiche: String
    },
    password:{
        type: String,
        required: true,
        minLength: [8, "password must conatain atleast 8 characters"],
        select : false
    },
    resume:{
        public_id: String,
        url: String
    },
    coverLetter:{
        type: String
    },
    role:{
        type: String,
        required: true,
        enum: ["Job Seeker", "Employer"]
    },
    createdAt:{
        type: Date,
        default: Date.now
    }
})


userSchema.methods.getJWTToken = function(){
    return jwt.sign({id: this._id}, process.env.JWT_SECRET_KEY, {
        expiresIn:process.env.JWT_EXPIRE
    })
}

userSchema.pre("save", async function (next){
    if(!this.isModified("password")){
        next()
    }
    this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password, this.password)
}



export const User = mongoose.model("User", userSchema)