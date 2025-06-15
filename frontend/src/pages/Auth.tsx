import React, { useState, useEffect } from 'react';
import { setToken } from '../services/auth';
import {
  MapPin, Eye, EyeOff, AlertTriangle, CheckCircle, User, Mail, Lock, Building, ArrowLeft
} from 'lucide-react';

// --- Types ---
interface LoginData {
  email: string;
  password: string;
  role: string;
  rememberMe: boolean;
}
interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  organization: string;
  acceptTerms: boolean;
}
interface AuthErrors {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  confirmPassword?: string;
  organization?: string;
  acceptTerms?: string;
  general?: string;
  [key: string]: string | undefined;
}

type LoginFormProps = {
  loginData: LoginData;
  errors: AuthErrors;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  handleLoginInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleLogin: () => void;
  switchMode: (mode: 'login' | 'register') => void;
};

type RegisterFormProps = {
  registerData: RegisterData;
  errors: AuthErrors;
  showRegisterPassword: boolean;
  setShowRegisterPassword: React.Dispatch<React.SetStateAction<boolean>>;
  showRegisterConfirmPassword: boolean;
  setShowRegisterConfirmPassword: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  handleRegisterInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleRegister: () => void;
  switchMode: (mode: 'login' | 'register') => void;
};

function LoginForm({
  loginData, errors, showPassword, setShowPassword, isLoading,
  handleLoginInputChange, handleLogin, switchMode,
}: LoginFormProps) {
  return (
    <div className="space-y-6">
      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Adresse email
        </label>
        <input
          type="email"
          name="email"
          value={loginData.email}
          onChange={handleLoginInputChange}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 ${errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
          placeholder="votre.email@example.com"
        />
        {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email}</span>}
      </div>
      {/* Mot de passe */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mot de passe
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={loginData.password}
            onChange={handleLoginInputChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 pr-12 ${errors.password ? 'border-red-300' : 'border-gray-300'
              }`}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={e => e.preventDefault()}
            onClick={() => setShowPassword(prev => !prev)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && <span className="text-red-500 text-sm mt-1">{errors.password}</span>}
      </div>
      {/* Type d'utilisateur */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type d'utilisateur
        </label>
        <select
          name="role"
          value={loginData.role}
          onChange={handleLoginInputChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
        >
          <option value="citoyen">Citoyen</option>
          <option value="gestionnaire">Gestionnaire urbain</option>
          <option value="Chercheur">Chercheur</option>
          <option value="admin">Administrateur</option>
        </select>
      </div>
      {/* Options */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            type="checkbox"
            name="rememberMe"
            checked={loginData.rememberMe}
            onChange={handleLoginInputChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-700">
            Se souvenir de moi
          </label>
        </div>
        <div className="text-sm">
          <button
            type="button"
            className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-200"
          >
            Mot de passe oublié ?
          </button>
        </div>
      </div>
      {/* Bouton de connexion */}
      <div>
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Connexion en cours...</span>
            </div>
          ) : (
            'Se connecter'
          )}
        </button>
      </div>
      {/* Lien vers inscription */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Pas encore de compte ?{' '}
          <button
            type="button"
            onClick={() => switchMode('register')}
            className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-200"
          >
            Créer un compte
          </button>
        </p>
      </div>
    </div>
  );
}

function RegisterForm({
  registerData, errors,
  showRegisterPassword, setShowRegisterPassword,
  showRegisterConfirmPassword, setShowRegisterConfirmPassword,
  isLoading, handleRegisterInputChange, handleRegister, switchMode
}: RegisterFormProps) {
  return (
    <div className="space-y-6">
      {/* Nom et Prénom */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline h-4 w-4 mr-1" />
            Prénom
          </label>
          <input
            type="text"
            name="firstName"
            value={registerData.firstName}
            onChange={handleRegisterInputChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 ${errors.firstName ? 'border-red-300' : 'border-gray-300'
              }`}
            placeholder="Jean"
          />
          {errors.firstName && <span className="text-red-500 text-sm mt-1">{errors.firstName}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom
          </label>
          <input
            type="text"
            name="lastName"
            value={registerData.lastName}
            onChange={handleRegisterInputChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 ${errors.lastName ? 'border-red-300' : 'border-gray-300'
              }`}
            placeholder="Dupont"
          />
          {errors.lastName && <span className="text-red-500 text-sm mt-1">{errors.lastName}</span>}
        </div>
      </div>
      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Mail className="inline h-4 w-4 mr-1" />
          Adresse email
        </label>
        <input
          type="email"
          name="email"
          value={registerData.email}
          onChange={handleRegisterInputChange}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 ${errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
          placeholder="jean.dupont@example.com"
        />
        {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email}</span>}
      </div>
      {/* Type d'utilisateur */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type de compte
        </label>
        <select
          name="role"
          value={registerData.role}
          onChange={handleRegisterInputChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
        >
          <option value="citoyen">Citoyen</option>
          <option value="chercheur">Chercheur</option>
          <option value="gestionnaire">Gestionnaire urbain</option>
        </select>
      </div>
      {/* Organisation (conditionnel) */}
      {(registerData.role === 'chercheur' || registerData.role === 'gestionnaire') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building className="inline h-4 w-4 mr-1" />
            Organisation
          </label>
          <input
            type="text"
            name="organization"
            value={registerData.organization}
            onChange={handleRegisterInputChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 ${errors.organization ? 'border-red-300' : 'border-gray-300'
              }`}
            placeholder="Nom de votre organisation"
          />
          {errors.organization && <span className="text-red-500 text-sm mt-1">{errors.organization}</span>}
        </div>
      )}
      {/* Mot de passe */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Lock className="inline h-4 w-4 mr-1" />
          Mot de passe
        </label>
        <div className="relative">
          <input
            type={showRegisterPassword ? 'text' : 'password'}
            name="password"
            value={registerData.password}
            onChange={handleRegisterInputChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 pr-12 ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
            placeholder="••••••••"
            autoComplete="new-password"
          />
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={e => e.preventDefault()}
            onClick={() => setShowRegisterPassword(prev => !prev)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showRegisterPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && <span className="text-red-500 text-sm mt-1">{errors.password}</span>}
      </div>
      {/* Confirmation mot de passe */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirmer le mot de passe
        </label>
        <div className="relative">
          <input
            type={showRegisterConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={registerData.confirmPassword}
            onChange={handleRegisterInputChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 pr-12 ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'}`}
            placeholder="••••••••"
            autoComplete="new-password"
          />
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={e => e.preventDefault()}
            onClick={() => setShowRegisterConfirmPassword(prev => !prev)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showRegisterConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.confirmPassword && <span className="text-red-500 text-sm mt-1">{errors.confirmPassword}</span>}
      </div>
      {/* Conditions d'utilisation */}
      <div>
        <div className="flex items-start">
          <input
            type="checkbox"
            name="acceptTerms"
            checked={registerData.acceptTerms}
            onChange={handleRegisterInputChange}
            className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1 ${errors.acceptTerms ? 'border-red-300' : ''
              }`}
          />
          <label className="ml-2 block text-sm text-gray-700">
            J'accepte les{' '}
            <button type="button" className="text-indigo-600 hover:text-indigo-500">
              conditions d'utilisation
            </button>{' '}
            et la{' '}
            <button type="button" className="text-indigo-600 hover:text-indigo-500">
              politique de confidentialité
            </button>
          </label>
        </div>
        {errors.acceptTerms && <span className="text-red-500 text-sm mt-1">{errors.acceptTerms}</span>}
      </div>
      {/* Bouton d'inscription */}
      <div>
        <button
          onClick={handleRegister}
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Création du compte...</span>
            </div>
          ) : (
            'Créer mon compte'
          )}
        </button>
      </div>
      {/* Lien vers connexion */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Déjà un compte ?{' '}
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-200"
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
}

const Auth: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    password: '',
    role: 'citoyen',
    rememberMe: false
  });

  const [registerData, setRegisterData] = useState<RegisterData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'citoyen',
    organization: '',
    acceptTerms: false
  });



  const [errors, setErrors] = useState<AuthErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // -- Gestion du mode via URL --
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    if (mode === 'register') {
      setCurrentMode('register');
    }
  }, []);

  // -- Change l'onglet et l'URL --
  const switchMode = (mode: 'login' | 'register') => {
    setCurrentMode(mode);
    setErrors({});
    const url = new URL(window.location.href);
    url.searchParams.set('mode', mode);
    window.history.pushState({}, '', url.toString());
  };

  // --- HANDLERS ---
  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | boolean = value;
    if (type === "checkbox" && "checked" in e.target) {
      newValue = (e.target as HTMLInputElement).checked;
    }
    setLoginData(prev => ({
      ...prev,
      [name]: newValue
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleRegisterInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | boolean = value;
    if (type === "checkbox" && "checked" in e.target) {
      newValue = (e.target as HTMLInputElement).checked;
    }
    setRegisterData(prev => ({
      ...prev,
      [name]: newValue
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  // --- VALIDATIONS ---
  const validateLogin = () => {
    const newErrors: AuthErrors = {};
    if (!loginData.email.trim()) newErrors.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(loginData.email)) newErrors.email = "Format d'email invalide";
    if (!loginData.password) newErrors.password = "Le mot de passe est requis";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = () => {
    const newErrors: AuthErrors = {};
    if (!registerData.firstName.trim()) newErrors.firstName = "Le prénom est requis";
    if (!registerData.lastName.trim()) newErrors.lastName = "Le nom est requis";
    if (!registerData.email.trim()) newErrors.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(registerData.email)) newErrors.email = "Format d'email invalide";
    if (!registerData.password) newErrors.password = "Le mot de passe est requis";
    else if (registerData.password.length < 8) newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";
    if (registerData.password !== registerData.confirmPassword) newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    if (!registerData.acceptTerms) newErrors.acceptTerms = "Vous devez accepter les conditions d'utilisation";
    if ((registerData.role === 'chercheur' || registerData.role === 'gestionnaire') && !registerData.organization.trim()) {
      newErrors.organization = "L'organisation est requise pour ce type de compte";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- LOGIN ---
  const handleLogin = async () => {
    if (!validateLogin()) return;
    setIsLoading(true);
    setErrors({});

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
          role: loginData.role, // tu peux l’envoyer, même si le backend ne s’en sert pas
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data.error || "Erreur de connexion" });
        return;
      }

      // Stocke le token & le rôle en localStorage
      localStorage.setItem('userToken', data.token);
      localStorage.setItem('userRole', data.role || loginData.role);

      // Redirige vers la page Home
      window.location.href = '/';
    } catch (err) {
      setErrors({ general: "Erreur réseau, impossible de joindre le serveur." });
    } finally {
      setIsLoading(false);
    }
  };


  // --- REGISTER ---
  const handleRegister = async () => {
    if (!validateRegister()) return;
    setIsLoading(true);
    setErrors({});

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          email: registerData.email,
          password: registerData.password,
          role: registerData.role,
          organization: registerData.organization,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data.message || "Erreur lors de l'inscription" });
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        switchMode("login");
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setErrors({ general: "Erreur réseau, impossible de joindre le serveur." });
    } finally {
      setIsLoading(false);
    }
  };


  // --- SUCCESS DISPLAY ---
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Inscription réussie !</h2>
          <p className="text-gray-600 mb-4">
            Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo et titre */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center mb-6">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {currentMode === 'login' ? 'Connexion à TechCity' : 'Rejoindre TechCity'}
          </h2>
          <p className="text-gray-600">
            {currentMode === 'login'
              ? 'Accédez à votre tableau de bord IoT'
              : 'Créez votre compte pour accéder aux données IoT'
            }
          </p>
        </div>
        {/* Onglets */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${currentMode === 'login'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Connexion
          </button>
          <button
            onClick={() => switchMode('register')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${currentMode === 'register'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Inscription
          </button>
        </div>
        {/* Formulaire */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          {errors.general && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-red-700 text-sm">{errors.general}</span>
            </div>
          )}
          {currentMode === 'login'
            ? <LoginForm
              loginData={loginData}
              errors={errors}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              isLoading={isLoading}
              handleLoginInputChange={handleLoginInputChange}
              handleLogin={handleLogin}
              switchMode={switchMode}
            />
            : <RegisterForm
              registerData={registerData}
              errors={errors}
              showRegisterPassword={showRegisterPassword}
              setShowRegisterPassword={setShowRegisterPassword}
              showRegisterConfirmPassword={showRegisterConfirmPassword}
              setShowRegisterConfirmPassword={setShowRegisterConfirmPassword}
              isLoading={isLoading}
              handleRegisterInputChange={handleRegisterInputChange}
              handleRegister={handleRegister}
              switchMode={switchMode}
            />
          }
        </div>
        {/* Retour à l'accueil */}
        <div className="text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="text-indigo-600 hover:text-indigo-500 font-medium transition duration-200 inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour à l'accueil
          </button>
        </div>
        {/* Demo credentials */}
        {currentMode === 'login' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Comptes de démonstration :</h4>
            <div className="text-xs text-yellow-700 space-y-1">
              <p><strong>Admin:</strong> admin@techcity.fr / admin123</p>
              <p><strong>Gestionnaire:</strong> gestionnaire@techcity.fr / gestionnaire123</p>
              <p><strong>Chercheur:</strong> chercheur@techcity.fr / chercheur123</p>
              <p><strong>Citoyen:</strong> citoyen@techcity.fr / citoyen123</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
