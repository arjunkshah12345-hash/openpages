import { redirect } from "next/navigation";

/** Legacy path — v2 is now the home page. */
export default function V2Redirect() {
  redirect("/");
}
