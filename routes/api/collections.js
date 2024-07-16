const express = require("express");
const { query, validationResult } = require("express-validator");
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const { t } = require("i18next");
const path = require("path");
const debug = require("debug")("collections");

// helpers
const { isEmpty, responseData, responseError } = require(path.resolve(
  "helpers/utils"
));

// validations
const validateCollection = require(path.resolve("validations/collection"));

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const prismaOptions = {
      include: {
        user: true,
        items: true,
      },
    };

    // pagination
    let { pageIndex, pageSize } = req.query;
    pageIndex = Number(pageIndex);
    pageSize = Number(pageSize);
    if (isNaN(pageIndex) || pageIndex < 0) {
      pageIndex = null;
    }
    if (isNaN(pageSize) || pageSize < 1) {
      pageSize = null;
    }
    if (pageIndex && pageSize) {
      prismaOptions.skip = (pageIndex - 1) * pageSize;
      prismaOptions.take = pageSize;
    }

    // conditions
    prismaOptions.where = {};
    let { name, featured } = req.query;
    if (typeof name === "string") {
      prismaOptions.where.name = { contains: name };
    }
    featured = Number(featured);
    if (featured === 0 || featured === 1) {
      prismaOptions.where.featured = Boolean(featured);
    }

    const collections = await prisma.collections.findMany(prismaOptions);
    return responseData(res, collections);
  } catch (error) {
    debug(error);
    return res.status(500).send(t("errors.internal_error"));
  } finally {
    prisma.$disconnect();
  }
});

router.post(
  "/",
  multer({ dest: "uploads/collections" }).single("image"),
  async (req, res) => {
    try {
      if (!isEmpty(req.file)) {
        debug(req.file);
        req.body.image = req.file.path;
      }
      const errors = validateCollection(req.body);
      if (errors.length > 0) {
        return responseError(res, errors[0]);
      }

      // get user with wallet address
      let user = await prisma.users.findFirst({
        where: {
          wallet_address: req.body.wallet_address,
        },
      });
      if (!user) {
        user = await prisma.users.create({
          data: {
            wallet_address: req.body.wallet_address,
          },
        });
        debug("New User", user);
      }

      // save item
      await prisma.collections.create({
        data: {
          name: req.body.name,
          image: req.body.image,
          user_id: user.id,
        },
      });
      return responseData(res);
    } catch (error) {
      debug(error);
      return responseError(res, t("errors.internal_error"));
    } finally {
      await prisma.$disconnect();
    }
  }
);

module.exports = router;
