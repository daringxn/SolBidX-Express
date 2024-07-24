const express = require("express");
const { body, validationResult } = require("express-validator");
const { PrismaClient } = require("@prisma/client");
const { t } = require("i18next");
const path = require("path");
const debug = require("debug")("offers");
const BigNumber = require("bignumber.js");

// helpers
const { responseData, responseError, LAMPORTS_PER_SOL } = require(path.resolve(
  "helpers/utils"
));
const logger = require(path.resolve("helpers/logger"));

const router = express.Router();
const prisma = new PrismaClient();

router.post(
  "/",
  [
    body("offerer_wallet_address")
      .isString()
      .withMessage(
        t("errors.validation.invalid", { name: "offerer wallet address" })
      ),
    body("token_address")
      .isString()
      .withMessage(t("errors.validation.invalid", { name: "token address" })),
    body("price")
      .isString()
      .withMessage(t("errors.validation.invalid", { name: "price" })),
  ],
  async (req, res) => {
    try {
      logger.info(
        "======================= INDEXER(OFFER) ======================="
      );
      const { errors } = validationResult(req);
      if (errors.length > 0) {
        return responseError(res, errors[0].msg);
      }

      const {
        offerer_wallet_address: offererWalletAddress,
        token_address: tokenAddress,
      } = req.body;
      let { price } = req.body;
      price = new BigNumber(price).dividedBy(LAMPORTS_PER_SOL).toNumber();
      logger.info("OFFERER WALLET ADDRESS: " + offererWalletAddress);
      logger.info("TOKEN ADDRESS: " + tokenAddress);
      logger.info("PRICE: " + price);

      const offerer = await prisma.users.upsert({
        where: {
          wallet_address: offererWalletAddress,
        },
        update: {},
        create: {
          wallet_address: offererWalletAddress,
        },
      });
      logger.info("OFFERER: " + JSON.stringify(offerer));

      const item = await prisma.items.findFirst({
        where: {
          contract_address: tokenAddress,
        },
      });
      if (!item) {
        logger.info("NOT FOUND ITEM");
        return responseError(
          res,
          t("errors.validation.invalid", { name: "token address" })
        );
      }
      logger.info("ITEM: " + JSON.stringify(item));

      const offer = await prisma.offers.findFirst({
        where: {
          user_id: offerer.id,
          item_id: item.id,
          status: "new",
        },
      });
      if (offer) {
        logger.info("ALREADY MADE OFFER");
        return responseError(res, t("errors.already_made_offer"));
      }

      await prisma.offers.create({
        data: {
          user_id: offerer.id,
          item_id: item.id,
          price,
          status: "new",
        },
      });

      return responseData(res);
    } catch (error) {
      debug(error);
      logger.info("ERROR: " + error);
      return responseError(res, t("errors.internal_error"));
    } finally {
      logger.info(
        "======================= INDEXER(OFFER) ======================="
      );
      logger.info("\n");
      logger.info("\n");
      await prisma.$disconnect();
    }
  }
);

router.post(
  "/cancel",
  [
    body("offerer_wallet_address")
      .isString()
      .withMessage(
        t("errors.validation.invalid", { name: "offerer wallet address" })
      ),
    body("token_address")
      .isString()
      .withMessage(t("errors.validation.invalid", { name: "token address" })),
  ],
  async (req, res) => {
    try {
      logger.info(
        "======================= INDEXER(OFFER) ======================="
      );
      const { errors } = validationResult(req);
      if (errors.length > 0) {
        return responseError(res, errors[0].msg);
      }

      const {
        offerer_wallet_address: offererWalletAddress,
        token_address: tokenAddress,
      } = req.body;
      logger.info("OFFERER WALLET ADDRESS: " + offererWalletAddress);
      logger.info("TOKEN ADDRESS: " + tokenAddress);

      const offerer = await prisma.users.findFirst({
        where: {
          wallet_address: offererWalletAddress,
        },
      });
      if (!offerer) {
        logger.info("NOT FOUND OFFERER");
        return responseError(
          res,
          t("errors.validation.invalid", { name: "offerer wallet address" })
        );
      }
      logger.info("OFFERER: " + JSON.stringify(offerer));

      const item = await prisma.items.findFirst({
        where: {
          contract_address: tokenAddress,
        },
      });
      if (!item) {
        logger.info("NOT FOUND ITEM");
        return responseError(
          res,
          t("errors.validation.invalid", { name: "token address" })
        );
      }
      logger.info("ITEM: " + JSON.stringify(item));

      const offer = await prisma.offers.findFirst({
        where: {
          user_id: offerer.id,
          item_id: item.id,
          status: "new",
        },
      });
      if (!offer) {
        logger.info("NOT FOUND OFFER");
        return responseError(res, t("invalid_request"));
      }

      await prisma.offers.update({
        where: {
          id: offer.id,
        },
        data: {
          status: "processed",
        },
      });

      return responseData(res);
    } catch (error) {
      debug(error);
      logger.info("ERROR: " + error);
      return responseError(res, t("errors.internal_error"));
    } finally {
      logger.info(
        "======================= INDEXER(OFFER) ======================="
      );
      logger.info("\n");
      logger.info("\n");
      await prisma.$disconnect();
    }
  }
);

module.exports = router;
