const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { t } = require("i18next");
const path = require("path");
const debug = require("debug")("items");

// helpers
const { isEmpty, responseData, responseError } = require(path.resolve(
  "helpers/utils"
));

// validations
const validateItem = require(path.resolve("validations/item"));

const router = express.Router();
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  try {
    // get item
    const item = await prisma.items.findFirst({
      where: {
        contract_address: req.body.token_address,
      },
    });
    if (!item) {
      return responseError(
        res,
        t("errors.validation.invalid", { name: "token address" })
      );
    }

    if (req.body.price) {
      req.body.price = Number(req.body.price);
    }

    const { status } = req.body;

    // list
    if (
      (item.status === "mint" ||
        item.status === "sale" ||
        item.status === "cancel") &&
      status === "list"
    ) {
      // save activity
      await prisma.activities.create({
        data: {
          item_id: item.id,
          type: "list",
          price: req.body.price,
          from_user_id: item.collector_id,
        },
      });
    }

    // sale
    // if (item.status === "list" && status === "sale") {
    //   let { offer_id: offerId, buyer_wallet_address: buyerWalletAddress } =
    //     req.body;

    //   let price = null;

    //   // buy
    //   if (buyerWalletAddress) {
    //     let user = await prisma.users.findFirst({
    //       where: {
    //         wallet_address: req.body.buyer_wallet_address,
    //       },
    //     });
    //     if (!user) {
    //       user = await prisma.users.create({
    //         data: {
    //           wallet_address: req.body.buyer_wallet_address,
    //         },
    //       });
    //     }
    //     req.body.collector_id = user.id;
    //     price = item.price;
    //   }

    //   // offer is accepted
    //   offerId = Number(offerId);
    //   if (offerId > 0) {
    //     const offer = await prisma.offers.findUnique({
    //       where: {
    //         id: offerId,
    //       },
    //     });
    //     if (offer) {
    //       req.body.collector_id = offer.user_id;
    //       price = offer.price;
    //     }
    //   }

    //   // process offers
    //   await prisma.offers.updateMany({
    //     where: {
    //       item_id: item.id,
    //       status: "new",
    //     },
    //     data: {
    //       status: "processed",
    //     },
    //   });

    //   // save activity
    //   await prisma.activities.create({
    //     data: {
    //       item_id: item.id,
    //       type: "sale",
    //       price,
    //       from_user_id: item.collector_id,
    //       to_user_id: req.body.collector_id,
    //     },
    //   });
    // }

    // // cancel
    // if (item.status === "list" && status === "cancel") {
    //   // process offers
    //   await prisma.offers.updateMany({
    //     where: {
    //       item_id: item.id,
    //       status: "new",
    //     },
    //     data: {
    //       status: "processed",
    //     },
    //   });

    //   // save activity
    //   await prisma.activities.create({
    //     data: {
    //       item_id: item.id,
    //       type: "cancel",
    //       from_user_id: item.collector_id,
    //     },
    //   });
    // }

    const fields = ["status", "collector_id", "price"];
    const values = {};
    fields.forEach((field) => {
      if (req.body[field]) {
        values[field] = req.body[field];
      }
    });

    // update item
    await prisma.items.update({
      where: {
        id: item.id,
      },
      data: values,
    });
    return responseData(res);
  } catch (error) {
    debug(error);
    return responseError(res, t("errors.internal_error"));
  } finally {
    await prisma.$disconnect();
  }
});

module.exports = router;
