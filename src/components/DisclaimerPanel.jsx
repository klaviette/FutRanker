import { useState } from 'react'
export default function DisclaimerPanel() {
    const [isOpen, setIsOpen] = useState(false)
  return (
    <section className="panel disclaimer-panel">
        <h3>About</h3>
            <div className="note">
              <p>
                This tool is solely for fun and does not reflect any real-world status. Its not a perfect tool; after all, you can't use
                numbers to determine the impact of Maradona on Serie A, nor can you quantify the influence of Pelé on Brazilian football.
              </p>
                            <p>
                Data was taken from TransferMarkt, Wikipedia, and RSSSF. I compiled it and created a static API in case I need to update 
                it in the future. Many data discrepancies exist across sources, so please take the numbers with a grain of salt.
              </p>
                <p>
                © 2026 Joshua Shapiro.
              </p>

                </div>
    </section>
  )
}
