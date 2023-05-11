const { Strategy, ExtractJwt } =require("passport-jwt");
const passport =require("passport");
const dotenv =require("dotenv/config");

// MODEL
const User =require("../models/users.js");

// JWT STRATEGY
passport.use(
  new Strategy(
    {
      secretOrKey: process.env.TOKEN_SECRET,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    },
    (payload, done) => {
      User.findById(payload._id)
        .then((user) => {
          if (user) {
            return done(null, user);
          }
          return done(null, false);
        })
        .catch((err) => console.log(err));
    }
  )
);

module.exports=passport.authenticate("jwt", { session: false });
