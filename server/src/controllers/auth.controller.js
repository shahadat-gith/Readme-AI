import User from '../models/User.js';

/**
 * Register a new user account.
 * POST /api/auth/register
 */
export async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are all required.',
    });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({ name, email, password });
    const token = user.generateAuthToken();

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user: user.toSafeObject(),
        token,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. '),
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
    });
  }
}

/**
 * Log in with email and password.
 * POST /api/auth/login
 */
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are both required.',
    });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = user.generateAuthToken();

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: user.toSafeObject(),
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
}

/**
 * Get the currently authenticated user's profile.
 * GET /api/auth/me
 */
export async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user.toSafeObject(),
    },
  });
}
