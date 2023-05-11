const express = require('express');
const mailController = require('../controllers/mailController');
const { uploadUserImage } = require('../utils/s3');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();

// user can get all mails
router
  .route('/')
  .get(protect,mailController.getAllMails)
  .post(
    protect,
    uploadUserImage,
    mailController.createMail
  );

//middleware to restrict admin routes
// router.use(protect, restrictTo('super-admin', 'admin'));

router
  .route('/active-deactive/:id')
  .patch(mailController.activateDeactivateMail);

router.route('/admin').get(mailController.getAllMailsForAdmin);

//user can delete a mail
router
  .route('/:id')
  .delete(mailController.deleteMail);

module.exports = router;
