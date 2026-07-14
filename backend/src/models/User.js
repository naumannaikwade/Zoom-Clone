const mongoose =require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,"please add a name"],
        trim:true,
        maxlength:[50,"name cannot be more than 50 characters"]
    },
    email:{
        type:String,
        required:[true,"please add an email"],
        unique:true,
        lowercase:true,
        match:[/^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            "please add a valid email"
        ]
    },
    password:{
        type:String,
        required:[true,"please add a password"],
        minlength:6,
        select:false
    },
    avatarUrl:{
        type:String,
        default:null
    },
    role:{
        type:String,
        enum:["user","admin"],
        default:"user",
    }
},{
    timestamps:true
});

userSchema.pre("save",async function(next) {
    if(!this.isModified("password")){
        return next();
    }

    const salt=await bcrypt.genSalt(10);
    this.password=await bcrypt.hash(this.password,salt);
});

//Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword,this.password);

};

module.exports=mongoose.model("User",userSchema);
