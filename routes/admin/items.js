const express = require("express");
const { body, validationResult } = require("express-validator");
const { PrismaClient } = require("@prisma/client");
const { t } = require("i18next");
const path = require("path");
const debug = require("debug")("collections");
const { PublicKey } = require("@solana/web3.js");

const router = express.Router();
const prisma = new PrismaClient();

// helpers
const logger = require(path.resolve("helpers/logger.js"));
const { responseData, responseError, getAllNFTs } = require(path.resolve(
  "helpers/utils.js"
));

router.post(
  "/",
  [
    body("mint_keys")
      .isString()
      .withMessage(
        t("errors.validation.invalid", { name: "the list of mint keys" })
      ),
    body("collection_id")
      .isNumeric()
      .withMessage(t("errors.validation.invalid", { name: "collection" })),
  ],
  async (req, res) => {
    try {
      logger.info(
        "==================== IMPORT ITEMS ========================="
      );
      const { errors } = validationResult(req);
      if (errors.length > 0) {
        return responseError(res, errors[0].msg);
      }
      let { collection_id: collectionId, mint_keys: mintKeys } = req.body;
      logger.info("COLLETION ID: " + collectionId);
      logger.info("MINT KEYS: " + mintKeys);
      const collection = await prisma.collections.findUnique({
        where: {
          id: Number(collectionId),
        },
      });
      if (!collection) {
        logger.info("INVALID_COLLECTION");
        return responseError(
          res,
          t("errors.validtion.invalid", { name: "collection" })
        );
      }
      mintKeys = mintKeys.split(",");
      for (let i = 0; i < mintKeys.length; i++) {
        // check if already exist
        const item = await prisma.items.findFirst({
          where: {
            contract_address: mintKeys[i],
          },
        });
        if (item) {
          logger.info("ALREADY EXIST: " + mintKeys[i]);
          continue;
        }

        // get item info
        const itemInfo = await getAllNFTs(new PublicKey(mintKeys[i]));
        logger.info("ITEM INFO: " + JSON.stringify(itemInfo));
        const newItem = {};

        // check collection
        if (
          itemInfo.collect &&
          itemInfo.collect !== collection.contract_address
        ) {
          logger.info("DECLINED ITEM: " + mintKeys[i]);
          continue;
        }

        // get item owner
        let itemOwner = await prisma.users.findFirst({
          where: {
            wallet_address: itemInfo.owner,
          },
        });
        if (!itemOwner) {
          itemOwner = await prisma.users.create({
            data: {
              wallet_address: itemInfo.owner,
            },
          });
        }

        newItem["name"] = itemInfo.metadata.name;
        newItem["description"] = itemInfo.metadata.description;
        newItem["image"] = itemInfo.metadata.image;
        newItem["contract_address"] = mintKeys[i];
        newItem["collection_id"] = collection.id;
        newItem["collector_id"] = itemOwner.id;
        newItem["status"] = "import";

        logger.info("NEW ITEM: " + JSON.stringify(newItem));

        await prisma.items.create({
          data: newItem,
        });
      }
      return responseData(res);
    } catch (error) {
      logger.info("ERROR: " + error);
      return responseError(res, t("errors.internal_error"));
    } finally {
      logger.info(
        "==================== IMPORT ITEMS ========================="
      );
      logger.info("\n");
      logger.info("\n");
      prisma.$disconnect();
    }
  }
);

module.exports = router;
