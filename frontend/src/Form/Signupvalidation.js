function validation(values) {
  let error = {};

  const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const password_pattern =
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[A-Za-z0-9!@#$%^&*()]{8,}$/;

  // 🔹 Email Validation
  if (values.email === "") {
    error.email = "Email should not be empty";
  } else if (!email_pattern.test(values.email)) {
    error.email = "Invalid Email Format";
  } else {
    error.email = "";
  }

  // 🔹 Password Validation
  if (values.password === "") {
    error.password = "Password should not be empty";
  } else if (!password_pattern.test(values.password)) {
    error.password =
      "Password must contain 8+ characters, 1 uppercase, 1 lowercase, 1 number";
  } else {
    error.password = "";
  }

  // 🔹 Confirm Password Validation
  if (values.confirmPassword === "") {
    error.confirmPassword = "Confirm Password should not be empty";
  } else if (values.confirmPassword !== values.password) {
    error.confirmPassword = "Passwords do not match";
  } else {
    error.confirmPassword = "";
  }

  return error;
}

export default validation;