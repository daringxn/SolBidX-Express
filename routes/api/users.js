const express = require("express");
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const i18next = require("i18next");
const path = require("path");
const debug = require("debug")("users");

// helpers
const { isEmpty, responseData, responseError } = require(path.resolve(
  "helpers/utils"
));

// validations
const validateUser = require(path.resolve("validations/user"));

const router = express.Router();
const prisma = new PrismaClient();

router.post(
  "/",
  multer({ dest: "uploads/users" }).single("avatar"),
  async (req, res) => {
    try {
      if (!isEmpty(req.file)) {
        debug(req.file);
        req.body.avatar = req.file.path;
      }
      if (!req.body.id) {
        const errors = validateUser(req.body);
        if (errors.length > 0) {
          return responseError(res, errors[0]);
        }

        // save user
        const newUser = await prisma.users.create({
          data: {
            name: req.body.name,
            wallet_address: req.body.wallet_address,
            email: req.body.email,
            phone_number: req.body.phone_number,
            bio: req.body.bio,
          },
        });

        return responseData(res, newUser);
      } else {
        // get user
        const user = await prisma.users.findUnique({
          where: {
            id: parseInt(req.body.id),
          },
        });
        if (!user) {
          return responseError(
            res,
            i18next.t("errors.validation.invalid", { name: "User" })
          );
        }

        const fields = ["name", "email", "phone_number", "bio", "avatar"];
        const values = {};
        fields.forEach((field) => {
          if (req.body[field]) {
            values[field] = req.body[field];
          }
        });
        debug("Update User", values);

        // update user
        const updatedUser = await prisma.users.update({
          where: {
            id: parseInt(req.body.id),
          },
          data: values,
        });
        return responseData(res, updatedUser);
      }
    } catch (error) {
      debug(error);
      return res.status(500).send(i18next.t("errors.internal_error"));
    } finally {
      prisma.$disconnect();
    }
  }
);

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.users.findUnique({
      where: {
        id,
      },
    });
    if (!user) {
      return responseError(
        res,
        i18next.t("errors.validation.invalid", { name: "User" })
      );
    }

    return responseData(res, user);
  } catch (error) {
    debug(error);
    return res.status(500).send(i18next.t("errors.internal_error"));
  } finally {
    prisma.$disconnect();
  }
});

router.get("/:id/collections", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.users.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (!user) {
      debug("Not Found User");
      return responseError(
        res,
        i18next.t("errors.validation.invalid", { name: "User" })
      );
    }
    const collections = await prisma.collections.findMany({
      where: {
        user_id: user.id,
      },
    });
    return responseData(res, collections);
  } catch (error) {
    debug(error);
    return res.status(500).send(i18next.t("errors.internal_error"));
  } finally {
    prisma.$disconnect();
  }
});

module.exports = router;
