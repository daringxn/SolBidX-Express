const path = require("path");
const i18next = require("i18next");

// helpers
const { isEmpty } = require(path.resolve("helpers/utils"));

module.exports = (data = {}) => {
  const errors = [];
  if (isEmpty(data.name)) {
    errors.push(i18next.t("errors.validation.required", { name: "Name" }));
  }
  if (isEmpty(data.description)) {
    errors.push(
      i18next.t("errors.validation.required", { name: "Description" })
    );
  }
  if (isEmpty(data.image)) {
    errors.push(i18next.t("errors.validation.required", { name: "Image" }));
  }
  if (isEmpty(data.price)) {
    errors.push(i18next.t("errors.validation.required", { name: "Price" }));
  }
  if (isEmpty(data.properties)) {
    errors.push(
      i18next.t("errors.validation.required", { name: "Properties" })
    );
  }
  if (isEmpty(data.size)) {
    errors.push(i18next.t("errors.validation.required", { name: "Size" }));
  }
  if (isEmpty(data.blockchain)) {
    errors.push(
      i18next.t("errors.validation.required", { name: "Blockchain" })
    );
  }
  if (isEmpty(data.royatity)) {
    errors.push(i18next.t("errors.validation.required", { name: "Royatity" }));
  }
  return errors;
};
