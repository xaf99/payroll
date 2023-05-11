const jwt =require("jsonwebtoken");
const dotenv=require("dotenv/config");

const token = (user) => {
  // generate jwt to access token
  const accessToken = jwt.sign({ _id: user._id,type:user.type }, process.env.TOKEN_SECRET);
  return accessToken;
};

module.exports=token;
