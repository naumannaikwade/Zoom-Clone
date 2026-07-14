const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {protect} =require("../middleware/auth");

const router=express.Router();

//generate jwt token
const generateToken=(id)=>{
    return jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRE || "7d",
    })
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post("/register",async(req,res)=>{
    try{
        const name=String(req.body.name || "").trim();
        const email=normalizeEmail(req.body.email);
        const password=String(req.body.password || "");

        if (!name || !email || password.length < 6) {
            return res.status(400).json({
                success:false,
                message:"name, a valid email, and a password of at least 6 characters are required"
            });
        }

        //check if user exists
        const userExists= await User.findOne({email});
        if(userExists){
            return res.status(400).json({
                success:false,
                message:"user already exists with this email"
            })
        }

        //create user
        const user = await User.create({
            name,
            email,
            password
        })

        if(user){
            res.status(201).json({
                success:true,
                data:{
                    _id:user._id,
                    name:user.name,
                    email:user.email,
                    token:generateToken(user._id)
                }
            });
        }
    } catch (error) {
        console.error("Registration failed:", error.message);
        res.status(400).json({
            success:false,
            message:"unable to register this account"
        });
    }
})

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post("/login",async(req,res)=>{
    try {
        const email=normalizeEmail(req.body.email);
        const password=String(req.body.password || "");

        if (!email || !password) {
            return res.status(400).json({
                success:false,
                message:"email and password are required"
            });
        }

        //check for user
        const user=await User.findOne({email}).select("+password");

        if(user && (await user.matchPassword(password))){
            res.json({
                success:true,
                data:{
                    _id:user._id,
                    name:user.name,
                    email:user.email,
                    token:generateToken(user._id)
                }
            });
        }else{
            res.status(401).json({
                success:false,
                message:"invalid credentials",
            })
        }

    } catch (error) {
        console.error("Login failed:", error.message);
        res.status(400).json({
            success:false,
            message:"unable to sign in",
        })
    }
})

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private

router.get("/me",protect,async(req,res)=>{
    try {
        const user=await User.findById(req.user.id);

        res.json({
            success:true,
            data:user
        });
    } catch (error) {
        console.error("Unable to load current user:", error.message);
        res.status(400).json({
            success:false,
            message:"unable to load the current user"
        });
    }
})

module.exports=router;
