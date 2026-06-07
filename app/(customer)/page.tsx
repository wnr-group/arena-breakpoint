import React from 'react'
import HeroCarousel from './home/hero-section/page'
import DevicePage from './home/device/page'
import FoodMenu from './home/food/page'
import SubscriptionPage from './home/subscription/page'
import Footer from '@/components/customer/layout/Footer'
import Testimonials from './home/testimonial/page'


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

