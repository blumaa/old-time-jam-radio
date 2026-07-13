import Link from "next/link";
import type { Metadata } from "next";
import "@/styles/copyright.css";

export const metadata: Metadata = {
  title: "Copyright — The Old-Time Dial",
  description: "Educational-use notice and copyright claims policy.",
};

export default function CopyrightPage() {
  return (
    <main className="copyright-page">
      <article className="copyright-page__content">
        <p className="copyright-page__lead">
          The content of this site is for educational use only.
        </p>

        <h1 className="copyright-page__heading">Copyright Claims</h1>

        <p>
          We endeavor to insure that all the tunes on the Old-Time Jam Radio 
          web site are in the public domain or that the owners have granted
          permission to include them here.
        </p>

        <p>
          If you are a copyright owner or agent thereof and believe that any of
          our content infringes upon your copyright, please submit notice,
          pursuant to the Digital Millennium Copyright Act (17 U.S.C. § 51) to
          our Copyright Agent with the following information: (i) an electronic
          or physical signature of the person authorized to act on behalf of the
          owner of the copyright; (ii) a description of the copyrighted work that
          you claim has been infringed; (iii) the URL of the location containing
          the material that you claim is infringing; (iv) your address,
          telephone number, and email address; (v) a statement by you that you
          have a good faith belief that the disputed use is not authorized by the
          copyright owner, its agent, or the law; and (vi) a statement by you,
          made under penalty of perjury, that the above information in your
          Notice is accurate and that you are the copyright owner or authorized
          to act on the copyright owner&rsquo;s behalf.
        </p>

        <p>
         Please contact the site maintainer with any issues:
          <br />
          By email:{" "}
          <a
            className="copyright-page__email"
            href="mailto:xblumaa@gmail.com"
          >
            xblumaa@gmail.com
          </a>
        </p>

        <p className="copyright-page__back">
          <Link href="/">&larr; Back to the radio</Link>
        </p>
      </article>
    </main>
  );
}
