import React from "react";
import { LuBookOpenCheck } from "react-icons/lu";
import { MdOutlineReviews } from "react-icons/md";
import { PiBooks, PiMoneyLight } from "react-icons/pi";
import { RiBookReadLine } from "react-icons/ri";
import { TbUsers } from "react-icons/tb";
import OverviewCard from "./OverviewCard";

const DashOverviewCards = ({ overview }) => {
  const {
    totalBooks,
    totalUsers,
    totalIssuedBooks,
    issuedBooks,
    totalReviews,
    totalFineCollected,
  } = overview || {};

  return (
    <div className="grid grid-cols-2 gap-3 p-3 sm:gap-5 sm:p-5 md:grid-cols-3 2xl:grid-cols-6">
      <OverviewCard
        title={totalBooks}
        desc="Total Books"
        icon={<PiBooks className="text-primary" />}
        bgColor="bg-[#FEF2E2]"
      />
      <OverviewCard
        title={totalUsers}
        desc="Total Members"
        icon={<TbUsers className="text-[#41C385]" />}
        bgColor="bg-[#E6F5EF]"
      />
      <OverviewCard
        title={totalIssuedBooks}
        desc="Total Issued"
        icon={<RiBookReadLine className="text-[#1F77FA]" />}
        bgColor="bg-[#E9F1FF]"
      />
      <OverviewCard
        title={issuedBooks}
        desc="Currently Issued"
        icon={<LuBookOpenCheck className="text-[#b92eff]" />}
        bgColor="bg-[#f7e8ff]"
      />
      <OverviewCard
        title={totalReviews}
        desc="Total Reviews"
        icon={<MdOutlineReviews className="text-[#79ea4f]" />}
        bgColor="bg-[#eeffe8]"
      />
      <OverviewCard
        title={`৳${totalFineCollected}`}
        desc="Fine Collected"
        icon={<PiMoneyLight className="text-[#ff2e6d]" />}
        bgColor="bg-[#ffe8ef]"
      />
    </div>
  );
};

export default DashOverviewCards;
