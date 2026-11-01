import React from "react";
import { Title } from "../components/Title";
import { assets } from "../assets/assets";
import NewsletterBox from "../components/NewsletterBox";

function About() {
  return (
    <div className="px-10">
      <div className="text-2xl text-center pt-8 border-t">
        <Title text1={"ABOUT"} text2={"  US"} />
      </div>

      <div className="my-10 flex flex-col justify-center items-center md:flex-row gap-16">
        <img
          className="w-full md:max-w-[456px] rounded-lg"
          src={assets.about_img}
          alt="Monkedition Fashion"
        />
        <div className="flex flex-col justify-center gap-6 md:w-2/4 text-gray-600 text-justify">
          <p>
            Welcome to Monkedition, where style meets comfort and affordability.
            We're thrilled to have you here! At Monkedition, we believe that
            fashion should be as unique as the people wearing it. That's why we
            specialize in creating high-quality t-shirts and streetwear – from
            classic fits to oversized and acid-washed styles – designed to make
            you stand out.
          </p>
          <p>
            Our collection is tailored for the new generation – the bold, the
            creative, and the unapologetically stylish. Whether you're an anime
            enthusiast, a Marvel or DC superfan, or someone who loves trendy,
            statement-making apparel, Monkedition has something for you.
          </p>
          <b className="text-gray-800">Our Mission</b>
          <p>
            At Monkedition, our mission is simple: to provide you with unique
            designs that let your personality shine while offering unbeatable
            comfort and value. With prices starting at just ₹800, we're
            committed to bringing you exceptional designs without breaking the
            bank.
          </p>
        </div>
      </div>

      <div className="text-xl py-4">
        <Title text1={"WHY"} text2={" CHOOSE US"} />
      </div>

      <div className="flex flex-col md:flex-row text-sm mb-20">
        <div className="border px-5 md:px-8 py-5 sm:py-10 flex flex-col gap-5">
          <b className="text-lg">Quality Assurance</b>
          <p className="text-gray-600 text-justify">
            We take pride in our streetwear designs that combine urban vibes
            with contemporary aesthetics, ensuring you look effortlessly cool
            wherever you go. Each piece is carefully crafted to meet our high
            standards of quality and style.
          </p>
        </div>
        <div className="border px-5 md:px-8 py-5 sm:py-10 flex flex-col gap-5">
          <b className="text-lg">Our Story</b>
          <p className="text-gray-600 text-justify">
            Monkedition was founded by a team of four passionate individuals who
            wear many hats – designers, developers, and dreamers. United by a
            shared vision, we set out to create a brand that resonates with
            today's youth. Our journey began with an idea, fueled by creativity
            and hard work.
          </p>
        </div>
        <div className="border px-5 md:px-8 py-5 sm:py-10 flex flex-col gap-5">
          <b className="text-lg">Looking Ahead</b>
          <p className="text-gray-600 text-justify">
            While we currently focus on delivering the best in t-shirt fashion
            and streetwear, we're excited about the possibilities the future
            holds. Collaborations with talented artists and designers are on the
            horizon, and we're eager to grow alongside our community.
          </p>
        </div>
      </div>

      <NewsletterBox />
    </div>
  );
}

export default About;
