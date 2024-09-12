import mongoose from "mongoose";

export const connection = () =>{
    mongoose.connect(process.env.MONGO_URI, {
        dbName: "JOB_PORTAL"
    }).then(()=>{
        console.log("database connection succesfull")
    }).catch(err=>{
        console.log("connectionn error", err)
    })
}