require("dotenv").config();

const mongoose = require("mongoose");
const Order = require("./models/Order");

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      tls: true,
    });

    const result = await Order.aggregate([
      {
        $match: {
          status: {
            $in: [
              "confirmed",
              "shipped",
              "delivered",
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          min: {
            $min: "$createdAt",
          },
          max: {
            $max: "$createdAt",
          },
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    console.log("ORDER DATE RANGE:");
    console.log(result[0]);

    await mongoose.disconnect();
  } catch (error) {
    console.error("ERROR:", error.message);
    process.exit(1);
  }
}

check();