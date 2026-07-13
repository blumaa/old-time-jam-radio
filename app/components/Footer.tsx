import Link from "next/link";
import "@/styles/footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <p className="site-footer__text">
        The content of this site is for{" "}
        <Link className="site-footer__link" href="/copyright">
          educational use only
        </Link>
        .
      </p>
    </footer>
  );
}
