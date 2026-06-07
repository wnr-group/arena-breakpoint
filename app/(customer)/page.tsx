import React from 'react'
import HeroCarousel from './home/hero-section/page'
import DevicePage from './home/device/page'
import FoodMenu from './home/food/page'
import SubscriptionPage from './home/subscription/page'
import Footer from '@/components/customer/layout/Footer'
import Testimonials from '@/components/customer/home/Testimonials'

export default function LandingPage(){
  return (
    <>
    <HeroCarousel></HeroCarousel>
     <DevicePage></DevicePage>
     <FoodMenu></FoodMenu>
     <SubscriptionPage></SubscriptionPage>
     <Testimonials></Testimonials>
     <Footer></Footer>
    </>
  )
}

