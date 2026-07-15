import PopularBrands from '@/components/home/PopularBrands';
import HeroSection from '@/components/home/HeroSection';
import UpcomingLaunches from '@/components/home/UpcomingLaunches';
import React from 'react'
import LatestCars from '@/components/home/LatestCars';
import PopularCars from '@/components/home/Popularcars';
import ElectricCars from '@/components/home/Electriccars';
import CompareCars from '@/components/home/Comparecars';
import Stories from '@/components/home/Stories';
import TrustedUsedCars from '@/components/home/Trustedusedcars';
import Reviews from '@/components/home/Reviews';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-[Inter]">
      <HeroSection/>
      <LatestCars/>
      <PopularBrands />
      <PopularCars/>
      <ElectricCars/>
      <Stories/>
      <TrustedUsedCars/>
      <UpcomingLaunches />
      <CompareCars/>
      <Reviews/>
    </div>
  );
}