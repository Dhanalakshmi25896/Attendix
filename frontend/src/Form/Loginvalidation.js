/*function validation(values) {
  let error = {};

  // 🔹 Username Validation (can be name or email)
  if (!values.username || values.username.trim() === "") {
    error.username = "Username should not be empty";
  } else if (values.username.trim().length < 3) {
    error.username = "Username must be at least 3 characters";
  } else {
    error.username = "";
  }

  // 🔹 Password Validation
  if (!values.password || values.password === "") {
    error.password = "Password should not be empty";
  } else if (values.password.length < 6) {
    error.password = "Password must be at least 6 characters";
  } else {
    error.password = "";
  }

  return error;
}

export default validation;
*/

function validation(values) {
  let error = {};

  // 🔹 Username Validation (can be name or email)
  if (!values.username || values.username.trim() === "") {
    error.username = "Username should not be empty";
  } else if (values.username.trim().length < 3) {
    error.username = "Username must be at least 3 characters";
  } else {
    error.username = "";
  }

  // 🔹 Password Validation
  if (!values.password || values.password === "") {
    error.password = "Password should not be empty";
  } else if (values.password.length < 6) {
    error.password = "Password must be at least 6 characters";
  } else {
    error.password = "";
  }

  return error;
}

export default validation;