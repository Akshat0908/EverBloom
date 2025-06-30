import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Heart, User, Mail, Lock, Sparkles, ArrowRight, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

interface FormData {
  email: string;
  password: string;
  name?: string;
}

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(data.email, data.password, data.name!);
      } else {
        await signIn(data.email, data.password);
      }
      reset();
    } catch (error) {
      // Error handling is done in the auth context
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    reset();
  };

  const features = [
    "🎁 AI-powered gift suggestions",
    "💌 Personalized message crafting",
    "📊 Relationship strength tracking",
    "⏰ Smart reminder system",
    "🎯 Tailored activity recommendations",
    "💝 Important date management"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink via-soft-cream to-soft-lavender flex">
      {/* Left Side - Beautiful Gradient Background */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-100 via-secondary-50 to-accent-50 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-200 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary-200 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, -180, -360],
              opacity: [0.05, 0.15, 0.05]
            }}
            transition={{ duration: 30, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent-200 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"
          />
        </div>
        
        {/* Floating Brand Elements */}
        <div className="absolute top-8 left-8 z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center space-x-3"
          >
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg">
              <Heart className="h-8 w-8 text-primary-600 animate-heartbeat" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-800">EverBloom</h1>
              <p className="text-sm text-gray-600">Nurture Every Connection</p>
            </div>
          </motion.div>
        </div>

        {/* Feature Showcase */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="absolute bottom-20 left-8 bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/50 shadow-2xl max-w-md"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Sparkles className="h-8 w-8 text-primary-500" />
            <h3 className="text-xl font-semibold text-gray-800">What awaits you</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                className="flex items-center space-x-2 text-sm text-gray-700"
              >
                <Star className="h-4 w-4 text-accent-500 flex-shrink-0" />
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Floating Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute top-1/3 right-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-xl max-w-xs"
        >
          <div className="flex items-center space-x-2 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
            ))}
          </div>
          <p className="text-sm text-gray-700 italic mb-3">
            "EverBloom transformed how I maintain relationships. The AI suggestions are incredibly thoughtful!"
          </p>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full"></div>
            <div>
              <p className="text-xs font-medium text-gray-800">Sarah M.</p>
              <p className="text-xs text-gray-500">Premium User</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8 relative">
        {/* Mobile Background */}
        <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50 opacity-50"></div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile Logo */}
          <div className="text-center mb-8 lg:hidden">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary-400 to-primary-600 rounded-2xl mb-4 shadow-lg"
            >
              <Heart className="h-10 w-10 text-white animate-heartbeat" />
            </motion.div>
            <h1 className="text-4xl font-display font-bold text-gray-800 mb-2">
              EverBloom
            </h1>
            <p className="text-gray-600">Nurture Every Connection</p>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl lg:text-4xl font-display font-bold text-gray-800 mb-3"
            >
              {isSignUp ? "Join EverBloom" : "Welcome Back"}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 text-lg"
            >
              {isSignUp 
                ? "Start nurturing your relationships with AI-powered insights"
                : "Continue your journey of meaningful connections"
              }
            </motion.p>
          </div>

          {/* Auth Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-primary-100"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      {...register('name', { 
                        required: isSignUp ? 'Name is required' : false,
                        minLength: { value: 2, message: 'Name must be at least 2 characters' }
                      })}
                      type="text"
                      id="name"
                      className="pl-12 pr-4 py-4 w-full border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white/70 text-lg"
                      placeholder="Your full name"
                    />
                  </div>
                  {errors.name && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 text-sm text-red-600"
                    >
                      {errors.name.message}
                    </motion.p>
                  )}
                </motion.div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Please enter a valid email address'
                      }
                    })}
                    type="email"
                    id="email"
                    className="pl-12 pr-4 py-4 w-full border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white/70 text-lg"
                    placeholder="your@email.com"
                  />
                </div>
                {errors.email && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-sm text-red-600"
                  >
                    {errors.email.message}
                  </motion.p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    })}
                    type="password"
                    id="password"
                    className="pl-12 pr-4 py-4 w-full border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white/70 text-lg"
                    placeholder="Enter your password"
                  />
                </div>
                {errors.password && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-sm text-red-600"
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(236, 72, 153, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-xl hover:shadow-2xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Sparkles className="animate-spin h-6 w-6 mr-3" />
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Heart className="h-6 w-6 mr-3" />
                    {isSignUp ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="h-6 w-6 ml-3" />
                  </div>
                )}
              </motion.button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={toggleMode}
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors text-lg"
              >
                {isSignUp 
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 text-center"
          >
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 mb-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Free to Start</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Join thousands of users building stronger relationships
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}