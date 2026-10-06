const axios = require("axios");

const ML_API_URL =
    process.env.ML_API_URL || "http://127.0.0.1:8001";

const predictStockout = async (productData) => {
    try {
        const response = await axios.post(
            `${ML_API_URL}/predict`,
            productData
        );

        return response.data;
    } catch (error) {
        console.error(
            "Stockout ML API Error:",
            error.response?.data || error.message
        );

        throw new Error("Stockout prediction service unavailable");
    }
};

module.exports = {
    predictStockout
};