// const User = require('../models/userModel');
const moment = require('moment');

exports.featuredListingExpire = async () => {
  const date = moment().format();

  await Listing.updateMany(
    {
      isActive: true,
      featuredExpiryDate: {
        $lte: new Date(date),
      },
    },
    {
      $set: {
        featuredExpiryDate: null,
        featuredStartDate: null,
        isFeatured: false,
      },
    }
  );
};

exports.featuredPortfolioExpire = async () => {
  const date = moment().format();

  await User.updateMany(
    {
      isActive: true,
      'portfolio.featuredPackageEndDate': {
        $lte: new Date(date),
      },
    },
    {
      $set: {
        'portfolio.featuredPackageEndDate': null,
        'portfolio.featuredPackageStartDate': null,
        'portfolio.isFeatured': false,
      },
    }
  );
};

exports.hostBookingComplete = async () => {
  const date = moment().format();

  await Booking.updateMany(
    {
      status: 'active',
      endDate: {
        $lte: new Date(date),
      },
    },
    {
      $set: {
        status: 'completed',
        responseStatus: 'auto-completed',
      },
    }
  );

  const foundBookings = await Booking.aggregate([
    {
      $match: {
        status: 'completed',
        updatedAt: {
          $gte: new Date(date),
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'host',
        foreignField: '_id',
        as: 'host',
      },
    },
    {
      $unwind: '$host',
    },
    {
      $project: {
        _id: 1,
        price: 1,
        host: 1,
      },
    },
  ]);

  if (foundBookings.length > 0) {
    await Promise.all(
      foundBookings.map(async (booking) => {
        await Transaction.findOneAndUpdate(
          {
            hostBooking: booking._id,
            transferFrom: 'admin',
            transferTo: 'host',
          },
          { status: 'booking-completed', message: 'Booking completed' },
          { new: true }
        );
        await User.findByIdAndUpdate(booking?.host?._id, {
          $inc: {
            'wallet.balance': 1 * booking?.price,
          },
        });
      })
    );
  }
};

exports.hostBookingCancel = async () => {
  const date = moment().format();

  const foundBookings = await Booking.find({ status: 'pending' });

  await Promise.all(
    foundBookings.map(async (booking) => {
      const apptDate = moment(booking.createdAt).add(24, 'hours');

      const currentDate = moment();

      var hoursDiff = currentDate.diff(apptDate, 'hours');

      if (hoursDiff > 24)
        await Booking.findOneAndUpdate(
          {
            _id: booking._id,
          },
          { status: 'cancelled', responseStatus: 'auto-cancelled' },
          { new: true }
        );
    })
  );
};

exports.portfolioBookingComplete = async () => {
  const date = moment().format();

  await OtherBooking.updateMany(
    {
      status: 'active',
      endDate: {
        $lte: new Date(date),
      },
    },
    {
      $set: {
        status: 'completed',
        responseStatus: 'auto-completed',
      },
    }
  );

  const foundBookings = await OtherBooking.aggregate([
    {
      $match: {
        status: 'completed',
        updatedAt: {
          $gte: new Date(date),
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'other',
        foreignField: '_id',
        as: 'other',
      },
    },
    {
      $unwind: '$other',
    },
    {
      $project: {
        _id: 1,
        price: 1,
        host: 1,
      },
    },
  ]);

  if (foundBookings.length > 0) {
    await Promise.all(
      foundBookings.map(async (booking) => {
        await Transaction.findOneAndUpdate(
          {
            otherBooking: booking._id,
            transferFrom: 'admin',
            transferTo: 'other',
          },
          { status: 'booking-completed', message: 'Booking completed' },
          { new: true }
        );
        await User.findByIdAndUpdate(booking?.other?._id, {
          $inc: {
            'wallet.balance': 1 * booking?.price,
          },
        });
      })
    );
  }
};

exports.portfolioBookingCancel = async () => {
  const date = moment().format();

  const foundBookings = await OtherBooking.find({ status: 'pending' });

  await Promise.all(
    foundBookings.map(async (booking) => {
      const apptDate = moment(booking.createdAt).add(24, 'hours');
      const currentDate = moment();
      const hoursDiff = currentDate.diff(apptDate, 'hours');
      if (hoursDiff > 24)
        await OtherBooking.findOneAndUpdate(
          {
            _id: booking._id,
          },
          { status: 'cancelled', responseStatus: 'auto-cancelled' },
          { new: true }
        );
    })
  );
};
