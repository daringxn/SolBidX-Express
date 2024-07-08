const isEmpty = (value) => {
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.length === 0) ||
    (typeof value === "object" && Object.keys(value).length === 0)
  )
    return true;
  return false;
};

const responseData = (res, data) => {
  return res.json({
    status: 1,
    data,
  });
};

const responseError = (res, error) => {
  return res.json({
    status: 0,
    error,
  });
};

module.exports = {
  isEmpty,
  responseData,
  responseError,
};
