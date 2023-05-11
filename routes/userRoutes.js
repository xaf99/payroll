const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const catchAsync = require('../utils/catchAsync');
const {
  protect,
  restrictTo,
} = require('../controllers/authController');

const { uploadUserImage } = require('../utils/s3');

const router = express.Router();

//dynamic api for signup
router.post('/signup', authController.signup);

//dynamic api for login
router.post('/login', authController.login);

//add applied candidate
router.post('/add-candidate',uploadUserImage,userController.addAppliedCandidate)
router.patch('/update-candidate/:id',uploadUserImage,userController.updateCandidate)

//admin login route
router.post('/admin-login', authController.adminLogin);

//user forgot password route
router.post('/forgotPassword', authController.forgotPassword);

//user reset password route
router.get('/resetPassword/:token', authController.resetPassword);

//user reset password done
router.post('/resetPasswordDone', authController.resetPasswordDone);

//user can verify himself after signup
router.get('/verify-me/:id', userController.verifyMe);

router.route('/service-provider/:id').get(userController.getSpecificUser);

router.get('/', userController.getAllUsers);

// Protect all routes after this middleware

router.use(protect);

router.post('/logout', authController.logout);
router.patch('/updateMyPassword', authController.updatePassword);
router.patch('/updateMe', uploadUserImage, userController.updateMe);
router.get('/me', userController.getMe, userController.getUser);



// middleware for admin routes
// router.use(restrictTo('super-admin', 'admin'));

router.patch(
  '/activate-deactivate/user/:id',
  restrictTo('admin'),
  userController.activeDeactiveUser
);

//getting user thorugh param id of user
router
  .route('/:id')
  .get(userController.getUser)

module.exports = router;
