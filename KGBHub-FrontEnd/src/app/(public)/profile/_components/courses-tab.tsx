"use client";

import { User } from "@/models";
import CourseCard from "@/components/course/course-card";
import Empty from "@/components/common/empty";
import { useAccountContext } from "@/contexts/account";
import { cn } from "@/lib/utils";
import { coursePublicApiRequests } from "@/services/course.service";
import { userApiRequest } from "@/services/user.service";
import React, { useEffect, useState } from "react";
import { Pagination } from "@nextui-org/react";

type Props = {
  profile: User;
};
const LIMIT = 8;

const CoursesTab = ({ profile }: Props) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [courses, setCourses] = useState<any>([]);
  const { user } = useAccountContext();
  const isMe = user?.email === profile.email;
  const isInstructor = profile.roles.some(
    (role) => role.role.name === "AUTHOR"
  );
  const [coursesByAuthor, setCoursesByAuthor] = React.useState<any>([]);
  useEffect(() => {
    const fetchCoursesOwn = async () => {
      try {
        const res = await coursePublicApiRequests.getList(
          `?byAuthor=${profile.id}`
        );
        if (res.status === 200) setCourses(res.payload);
      } catch (error) {}
    };
    async function fetchCoursesBought() {
      try {
        const res = await userApiRequest.getCourseBought({
          limit: LIMIT,
          offset: LIMIT * (Number(currentPage) - 1),
        });
        if (res.status === 200) {
          setCourses(res.payload);
          setTotalPage(res.pagination.totalPages);
        }
      } catch (error) {}
    }
    if (isMe) {
      fetchCoursesBought();
    } else if (!isMe && isInstructor) {
      fetchCoursesOwn();
    } else {
      setCourses([]);
    }
  }, [currentPage]);
  return (
    <>
      <div
        className={cn(
          "",
          courses && courses.length > 0 ? "grid grid-cols-4 gap-4" : ""
        )}
      >
        {courses && courses.length > 0 ? (
          courses.map((course: any) => (
            <CourseCard key={course.id} data={course} showProcess />
          ))
        ) : (
          <Empty />
        )}
      </div>
      <Pagination
        initialPage={1}
        className="mx-auto w-fit mt-2"
        page={Number(currentPage || 1)}
        total={totalPage ?? 1}
        onChange={(e) => {
          setCurrentPage(e);
        }}
      />
    </>
  );
};

export default CoursesTab;
