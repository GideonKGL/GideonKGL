import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../database/prisma";
import { forbidden, notFound } from "../../utils/app-error";
import { getPagination, paginatedResponse } from "../../utils/pagination";
import type { UpdateProfileInput, UpdateUserAccessInput, UserQuery } from "./user.validation";

const userSelect = {
  id: true,
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  role: true,
  firebaseUid: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true
} as const;

const directoryRoles: Role[] = [Role.ADMIN, Role.DISPATCHER];

export const listUsers = async (requestingUser: { role: Role }, query: UserQuery) => {
  if (!directoryRoles.includes(requestingUser.role)) {
    throw forbidden();
  }

  const { skip, take } = getPagination(query);
  const where: Prisma.UserWhereInput = {
    role: query.role,
    isActive: query.isActive,
    OR: query.search
      ? [
          { email: { contains: query.search, mode: "insensitive" } },
          { firstName: { contains: query.search, mode: "insensitive" } },
          { lastName: { contains: query.search, mode: "insensitive" } },
          { phone: { contains: query.search } }
        ]
      : undefined
  };

  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: userSelect
    }),
    prisma.user.count({ where })
  ]);

  return paginatedResponse(data, total, query);
};

export const getUser = async (requestingUser: { id: string; role: Role }, id: string) => {
  if (requestingUser.id !== id && !directoryRoles.includes(requestingUser.role)) {
    throw forbidden();
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect
  });

  if (!user) {
    throw notFound("User");
  }

  return user;
};

export const updateProfile = async (userId: string, input: UpdateProfileInput) =>
  prisma.user.update({
    where: { id: userId },
    data: input,
    select: userSelect
  });

export const updateUserAccess = async (
  requestingUser: { id: string; role: Role },
  id: string,
  input: UpdateUserAccessInput
) => {
  if (requestingUser.role !== Role.ADMIN) {
    throw forbidden();
  }

  if (requestingUser.id === id && input.isActive === false) {
    throw forbidden("Admins cannot deactivate their own account");
  }

  return prisma.user.update({
    where: { id },
    data: input,
    select: userSelect
  });
};
