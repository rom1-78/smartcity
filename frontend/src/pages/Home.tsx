import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { isLoggedIn } from "../services/auth";
import { useNavigate } from "react-router-dom";



import {
  MapPin,
  Thermometer,
  Wind,
  Volume2,
  Car,
  Users,
  BarChart3,
  Shield,
  Smartphone,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import type { LucideIcon } from "lucide-react";

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const logged = isLoggedIn();
  const navigate = useNavigate();

  // Données simulées pour les statistiques en temps réel
  const stats: { label: string; value: string; icon: LucideIcon; color: string }[] = [
    { label: 'Capteurs actifs', value: '1,247', icon: MapPin, color: 'text-blue-500' },
    { label: 'Température moyenne', value: '22°C', icon: Thermometer, color: 'text-orange-500' },
    { label: 'Qualité de l\'air', value: 'Bonne', icon: Wind, color: 'text-green-500' },
    { label: 'Niveau sonore', value: '45 dB', icon: Volume2, color: 'text-purple-500' }
  ];

  const features: { icon: LucideIcon; title: string; description: string }[] = [
    {
      icon: BarChart3,
      title: 'Analyse en temps réel',
      description: 'Visualisez les données de vos capteurs IoT instantanément avec des graphiques interactifs et des cartes thermiques.'
    },
    {
      icon: Shield,
      title: 'Alertes intelligentes',
      description: 'Recevez des notifications automatiques lorsque les seuils de sécurité sont dépassés dans votre quartier.'
    },
    {
      icon: Users,
      title: 'Multi-utilisateurs',
      description: 'Plateforme adaptée aux gestionnaires urbains, citoyens, chercheurs avec des permissions personnalisées.'
    },
    {
      icon: Smartphone,
      title: 'Interface responsive',
      description: 'Accédez à vos données depuis n\'importe quel appareil : ordinateur, tablette ou smartphone.'
    }
  ];

  // Fonctions de redirection
  const handleLogin = () => {
    window.location.href = '/auth?mode=login';
  };

  const handleDashboard = () => {
    // Vérifie si l'utilisateur est connecté (token présent)
    const token = localStorage.getItem('userToken');
    if (token) {
      // Redirige vers le dashboard
      window.location.href = '/dashboard';
    } else {
      // Sinon, redirige vers la page de connexion
      window.location.href = '/auth?mode=login';
    }
  };

  const handleDashboardOrLogin = () => {
    if (logged) navigate("/dashboard");
    else navigate("/auth?mode=login");
  };

  const handleRegister = () => {
    window.location.href = '/auth?mode=register';
  };

  const handleViewPublicData = () => {
    window.location.href = '/donnees-publiques';
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Bienvenue dans <span className="text-yellow-300">TechCity</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-indigo-100 max-w-3xl mx-auto">
              Plateforme intelligente de gestion et d'analyse des données IoT
              pour une ville connectée et durable
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDashboardOrLogin}
                className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-200 transform hover:scale-105"
              >
                Accéder au tableau de bord
              </button>
              <button
                onClick={handleViewPublicData}
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition duration-200"
              >
                Découvrir les données publiques
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Données en temps réel
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Suivez l'évolution des paramètres environnementaux de TechCity
              grâce à notre réseau de capteurs IoT répartis dans toute la ville
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Fonctionnalités avancées
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Une plateforme complète conçue pour répondre aux besoins
              de tous les acteurs de la ville intelligente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group hover:transform hover:scale-105 transition duration-200">
                <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200 transition duration-200">
                  <feature.icon className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à explorer vos données ?
          </h2>
          <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
            Rejoignez les milliers d'utilisateurs qui font confiance à TechCity
            pour surveiller et améliorer leur environnement urbain
          </p>
          <button
            onClick={handleLogin}
            className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-200 transform hover:scale-105 inline-flex items-center"
          >
            Commencer maintenant
            <ChevronRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold">TechCity</span>
              </div>
              <p className="text-gray-400 text-sm">
                Plateforme intelligente pour une ville connectée et durable.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Fonctionnalités</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition duration-200">Données temps réel</a></li>
                <li><a href="#" className="hover:text-white transition duration-200">Alertes intelligentes</a></li>
                <li><a href="#" className="hover:text-white transition duration-200">Analyses prédictives</a></li>
                <li><a href="#" className="hover:text-white transition duration-200">Rapports dynamiques</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Utilisateurs</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition duration-200">Citoyens</a></li>
                <li><a href="#" className="hover:text-white transition duration-200">Gestionnaires urbains</a></li>
                <li><a href="#" className="hover:text-white transition duration-200">Chercheurs</a></li>
                <li><a href="#" className="hover:text-white transition duration-200">Administrateurs</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition duration-200">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition duration-200">API</a></li>
                <li><a href="#" className="hover:text-white transition duration-200">Contact</a></li>
                <li><a href="#" className="hover:text-white transition duration-200">Aide</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 TechCity IoT Platform. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;