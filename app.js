const body = document.body;
const serviceMenu = document.querySelector("[data-menu]");
const menuButton = document.querySelector("[data-menu-open]");
const menuLinks = document.querySelectorAll(".service-menu__panel a");
const contactForm = document.querySelector(".contact-form");
const phoneInput = document.querySelector('input[name="phone"]');
const validatedFields = document.querySelectorAll("[data-validate]");
const formStatus = document.querySelector("[data-form-status]");
const cookieBanner = document.querySelector("[data-cookie-banner]");
const cookieAcceptButton = document.querySelector("[data-cookie-accept]");
const COOKIE_KEY = "pritok_cookie_accepted";
let formStatusTimer;

function getScrollbarWidth() {
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
}

function getPhoneDigits(value) {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("7") || digits.startsWith("8")) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 10);
}

function formatPhone(digits) {
  if (!digits) return "";

  const area = digits.slice(0, 3);
  const first = digits.slice(3, 6);
  const second = digits.slice(6, 8);
  const third = digits.slice(8, 10);
  let value = `+7 (${area}`;

  if (area.length === 3) value += ")";
  if (first) value += ` ${first}`;
  if (second) value += `-${second}`;
  if (third) value += `-${third}`;

  return value;
}

function countPhoneDigitsBefore(value, position) {
  let count = 0;
  let skippedPrefix = false;

  for (let index = 0; index < position; index += 1) {
    const char = value[index];

    if (!/\d/.test(char)) continue;

    if (!skippedPrefix && (char === "7" || char === "8")) {
      skippedPrefix = true;
      continue;
    }

    count += 1;
  }

  return count;
}

function getPhoneCaretPosition(value, digitCount) {
  if (!value || digitCount <= 0) {
    return value ? value.indexOf("(") + 1 : 0;
  }

  let count = 0;
  let skippedPrefix = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (!/\d/.test(char)) continue;

    if (!skippedPrefix && char === "7") {
      skippedPrefix = true;
      continue;
    }

    count += 1;

    if (count === digitCount) {
      return index + 1;
    }
  }

  return value.length;
}

function setPhoneValue(input, digits, caretDigitCount = digits.length) {
  const formatted = formatPhone(digits);
  input.value = formatted;

  const caretPosition = getPhoneCaretPosition(formatted, caretDigitCount);
  input.setSelectionRange(caretPosition, caretPosition);
}

function getFieldError(input) {
  const value = input.value.trim();

  if (input.name === "name") {
    if (!value) return "Укажите имя.";
    if (value.length < 2) return "Имя должно быть не короче 2 символов.";
    return "";
  }

  if (input.name === "phone") {
    if (!value) return "Укажите номер телефона.";
    if (getPhoneDigits(value).length !== 10) return "Введите телефон в формате +7 (000) 000-00-00.";
    return "";
  }

  if (input.name === "telegram") {
    if (!value) return "";
    if (!/^@?[a-zA-Z0-9_]{5,32}$/.test(value)) {
      return "Telegram можно указать как @username, от 5 до 32 символов.";
    }
    return "";
  }

  if (input.name === "comment") {
    if (!value) return "Коротко опишите проект или вопрос.";
    if (value.length < 5) return "Добавьте немного больше деталей.";
    return "";
  }

  return "";
}

function setFieldState(input, message, forceState = false) {
  const field = input.closest(".form-field");
  const error = field?.querySelector(".field-error");

  if (!field || !error) return;

  field.classList.toggle("is-invalid", Boolean(message));
  field.classList.toggle("is-valid", !message && (forceState || input.value.trim().length > 0));
  input.setAttribute("aria-invalid", String(Boolean(message)));
  error.textContent = message;
}

function validateField(input, forceState = false) {
  const message = getFieldError(input);
  setFieldState(input, message, forceState);
  return !message;
}

function validateContactForm() {
  let firstInvalid = null;

  validatedFields.forEach((input) => {
    const isValid = validateField(input, true);

    if (!isValid && !firstInvalid) {
      firstInvalid = input;
    }
  });

  if (firstInvalid) {
    firstInvalid.focus();
    return false;
  }

  return true;
}

function clearFormValidation() {
  validatedFields.forEach((input) => {
    const field = input.closest(".form-field");
    const error = field?.querySelector(".field-error");

    field?.classList.remove("is-invalid", "is-valid");
    input.removeAttribute("aria-invalid");

    if (error) {
      error.textContent = "";
    }
  });
}

function setMenuState(isOpen) {
  if (!serviceMenu || !menuButton) return;

  if (isOpen) {
    body.style.setProperty("--scrollbar-compensation", `${getScrollbarWidth()}px`);
    serviceMenu.scrollTop = 0;
  } else {
    body.style.removeProperty("--scrollbar-compensation");
  }

  serviceMenu.classList.toggle("is-open", isOpen);
  serviceMenu.setAttribute("aria-hidden", String(!isOpen));
  menuButton.classList.toggle("is-open", isOpen);
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
  body.classList.toggle("is-locked", isOpen);
}

if (menuButton) {
  menuButton.addEventListener("click", () => {
    setMenuState(!serviceMenu.classList.contains("is-open"));
  });
}

menuLinks.forEach((link) => {
  link.addEventListener("click", () => setMenuState(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenuState(false);
  }
});

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateContactForm()) {
      if (formStatus) {
        formStatus.hidden = true;
      }

      return;
    }

    contactForm.reset();
    clearFormValidation();

    if (formStatus) {
      clearTimeout(formStatusTimer);
      formStatus.textContent = "Заявка принята. Мы свяжемся с вами по указанным контактам.";
      formStatus.hidden = false;
      formStatusTimer = setTimeout(() => {
        formStatus.hidden = true;
      }, 3200);
    }
  });
}

validatedFields.forEach((input) => {
  input.addEventListener("input", () => {
    validateField(input);

    if (formStatus) {
      formStatus.hidden = true;
    }
  });

  input.addEventListener("blur", () => {
    validateField(input, true);
  });
});

if (phoneInput) {
  phoneInput.addEventListener("keydown", (event) => {
    const { value, selectionStart, selectionEnd } = phoneInput;

    if (event.key !== "Backspace" || selectionStart !== selectionEnd || selectionStart === 0) {
      return;
    }

    const previousChar = value[selectionStart - 1];

    if (/\d/.test(previousChar)) {
      return;
    }

    const previousDigitPosition = value.slice(0, selectionStart).search(/\d(?=\D*$)/);

    if (previousDigitPosition === -1) {
      event.preventDefault();
      setPhoneValue(phoneInput, "");
      return;
    }

    const digits = getPhoneDigits(value);
    const removeIndex = countPhoneDigitsBefore(value, previousDigitPosition + 1) - 1;

    if (removeIndex < 0) {
      event.preventDefault();
      setPhoneValue(phoneInput, digits);
      return;
    }

    const nextDigits = `${digits.slice(0, removeIndex)}${digits.slice(removeIndex + 1)}`;
    event.preventDefault();
    setPhoneValue(phoneInput, nextDigits, removeIndex);
  });

  phoneInput.addEventListener("input", () => {
    const caretDigitCount = countPhoneDigitsBefore(phoneInput.value, phoneInput.selectionStart);
    const digits = getPhoneDigits(phoneInput.value);
    setPhoneValue(phoneInput, digits, caretDigitCount);
  });
}

if (cookieBanner && cookieAcceptButton) {
  const isAccepted = localStorage.getItem(COOKIE_KEY) === "true";
  cookieBanner.hidden = isAccepted;
  body.classList.toggle("has-cookie-banner", !isAccepted);

  cookieAcceptButton.addEventListener("click", () => {
    localStorage.setItem(COOKIE_KEY, "true");
    cookieBanner.hidden = true;
    body.classList.remove("has-cookie-banner");
  });
}
